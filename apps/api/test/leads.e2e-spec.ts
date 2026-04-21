import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';

/**
 * Build a fresh Nest app mirroring `main.ts` validation pipeline so the tests
 * exercise the real request → validation → sanitize → DB path. A fresh app
 * per test is cheap (in-process, no network) and gives us a clean throttler
 * in-memory store for each case — otherwise the 5/60s per-route limit on
 * POST /leads bleeds across tests and trips false 429s.
 */
async function buildApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

describe('Leads (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const built = await buildApp();
    app = built.app;
    prisma = built.prisma;
    await prisma.$executeRaw`TRUNCATE "Lead" RESTART IDENTITY CASCADE`;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /leads', () => {
    it('creates a lead with a valid payload (201 + normalized persistence)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: '  Jane Doe  ',
          businessEmail: '  Jane.Doe@Example.COM ',
          country: 'us',
          message: 'Interested in your RD services.',
        })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
      });
      expect(Number.isNaN(Date.parse(res.body.createdAt))).toBe(false);

      const rows = await prisma.lead.findMany();
      expect(rows).toHaveLength(1);
      const [row] = rows;
      expect(row.id).toBe(res.body.id);
      expect(row.businessEmail).toBe('jane.doe@example.com');
      expect(row.country).toBe('US');
      // sanitizePlainText trims
      expect(row.name).toBe('Jane Doe');
      expect(row.message).toBe('Interested in your RD services.');
    });

    it('400 when businessEmail is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'Jane',
          businessEmail: 'not-an-email',
          country: 'US',
        })
        .expect(400);

      // AllExceptionsFilter wraps the ValidationPipe response so the body is:
      //   { statusCode, timestamp, path, message: { message: [...], error, statusCode } }
      const inner = res.body.message;
      const msgs = Array.isArray(inner?.message) ? inner.message : inner;
      const joined = Array.isArray(msgs) ? msgs.join('\n') : JSON.stringify(msgs);
      expect(joined.toLowerCase()).toContain('email');
    });

    it('400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/leads')
        .send({
          businessEmail: 'jane@example.com',
          country: 'US',
        })
        .expect(400);
    });

    it('400 when country is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'Jane',
          businessEmail: 'jane@example.com',
        })
        .expect(400);
    });

    it('400 when an unknown property is provided (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: 'Jane',
          businessEmail: 'jane@example.com',
          country: 'US',
          extra: 'nope',
        })
        .expect(400);

      const inner = res.body.message;
      const msgs = Array.isArray(inner?.message) ? inner.message : inner;
      const joined = Array.isArray(msgs) ? msgs.join('\n') : JSON.stringify(msgs);
      expect(joined.toLowerCase()).toContain('extra');
    });

    it('strips HTML from name and message before persisting', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/leads')
        .send({
          name: '<script>alert(1)</script>Jane',
          businessEmail: 'jane+html@example.com',
          country: 'GB',
          message: 'Hello <b>world</b>',
        })
        .expect(201);

      const row = await prisma.lead.findUnique({ where: { id: res.body.id } });
      expect(row).not.toBeNull();
      expect(row!.name).toBe('Jane');
      expect(row!.message).toBe('Hello world');
    });
  });

  describe('POST /leads — throttling', () => {
    it('returns 429 once the per-route limit (5/60s) is exceeded', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 10; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/leads')
          .send({
            name: `User ${i}`,
            businessEmail: `user${i}@example.com`,
            country: 'US',
          });
        statuses.push(res.status);
        if (res.status === 429) break;
      }

      // At least one 429 must surface within the burst
      expect(statuses).toContain(429);
      // The first 5 must succeed before any 429 appears
      expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    });
  });

  // Seeding helper — bypasses POST (its throttler + DTO normalization) and
  // lets us control `createdAt` so time-bucket assertions are deterministic.
  async function seed(
    p: PrismaService,
    rows: Array<{
      name?: string;
      businessEmail?: string;
      country?: string;
      message?: string | null;
      createdAt?: Date;
    }>,
  ) {
    for (const r of rows) {
      await p.lead.create({
        data: {
          name: r.name ?? 'Seed User',
          businessEmail: r.businessEmail ?? `seed-${Math.random()}@example.com`,
          country: r.country ?? 'US',
          message: r.message ?? null,
          ...(r.createdAt ? { createdAt: r.createdAt } : {}),
        },
      });
    }
  }

  describe('GET /leads (list)', () => {
    it('returns empty list with pagination metadata when no leads exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/leads')
        .expect(200);

      expect(res.body).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
    });

    it('returns seeded leads newest-first with pagination metadata', async () => {
      const now = Date.now();
      await seed(prisma, [
        { name: 'Oldest', businessEmail: 'oldest@example.com', createdAt: new Date(now - 3 * 60_000) },
        { name: 'Middle', businessEmail: 'middle@example.com', createdAt: new Date(now - 2 * 60_000) },
        { name: 'Newest', businessEmail: 'newest@example.com', createdAt: new Date(now - 1 * 60_000) },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/leads')
        .expect(200);

      expect(res.body.total).toBe(3);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
      expect(res.body.items).toHaveLength(3);
      expect(res.body.items.map((i: { name: string }) => i.name)).toEqual([
        'Newest',
        'Middle',
        'Oldest',
      ]);
      // each row should expose the schema fields
      const first = res.body.items[0];
      expect(first).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          businessEmail: expect.any(String),
          country: expect.any(String),
          createdAt: expect.any(String),
        }),
      );
    });

    it('respects pageSize', async () => {
      const rows = Array.from({ length: 25 }, (_, i) => ({
        name: `User ${i}`,
        businessEmail: `user${i}@example.com`,
      }));
      await seed(prisma, rows);

      const res = await request(app.getHttpServer())
        .get('/api/leads?pageSize=10')
        .expect(200);

      expect(res.body.total).toBe(25);
      expect(res.body.pageSize).toBe(10);
      expect(res.body.items).toHaveLength(10);
    });

    it('paginates with page=2', async () => {
      const now = Date.now();
      // 25 rows, createdAt descending (newest first => first inserted is newest)
      const rows = Array.from({ length: 25 }, (_, i) => ({
        name: `User ${String(i).padStart(2, '0')}`,
        businessEmail: `user${i}@example.com`,
        createdAt: new Date(now - i * 60_000),
      }));
      await seed(prisma, rows);

      const page1 = await request(app.getHttpServer())
        .get('/api/leads?page=1&pageSize=10')
        .expect(200);
      const page2 = await request(app.getHttpServer())
        .get('/api/leads?page=2&pageSize=10')
        .expect(200);

      expect(page1.body.items).toHaveLength(10);
      expect(page2.body.items).toHaveLength(10);
      expect(page2.body.page).toBe(2);

      const page1Ids = new Set(page1.body.items.map((i: { id: string }) => i.id));
      const page2Ids = new Set(page2.body.items.map((i: { id: string }) => i.id));
      // pages must be disjoint
      for (const id of page2Ids) expect(page1Ids.has(id)).toBe(false);

      // newest first: page 1 starts with User 00, page 2 starts with User 10
      expect(page1.body.items[0].name).toBe('User 00');
      expect(page2.body.items[0].name).toBe('User 10');
    });

    it('filters by q across name/email/country (case-insensitive)', async () => {
      await seed(prisma, [
        { name: 'Jane Doe', businessEmail: 'jane@acme.com', country: 'US' },
        { name: 'John Smith', businessEmail: 'john@other.com', country: 'GB' },
        { name: 'Bob', businessEmail: 'bob@corp.com', country: 'DE' },
      ]);

      const byName = await request(app.getHttpServer())
        .get('/api/leads?q=JANE')
        .expect(200);
      expect(byName.body.total).toBe(1);
      expect(byName.body.items[0].name).toBe('Jane Doe');

      const byEmail = await request(app.getHttpServer())
        .get('/api/leads?q=acme')
        .expect(200);
      expect(byEmail.body.total).toBe(1);
      expect(byEmail.body.items[0].businessEmail).toBe('jane@acme.com');

      const byCountry = await request(app.getHttpServer())
        .get('/api/leads?q=gb')
        .expect(200);
      expect(byCountry.body.total).toBe(1);
      expect(byCountry.body.items[0].country).toBe('GB');
    });

    it('clamps pageSize to 100', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/leads?pageSize=9999')
        .expect(200);

      expect(res.body.pageSize).toBe(100);
    });

    it('rejects invalid page/pageSize with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/leads?page=-1')
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/leads?pageSize=abc')
        .expect(400);
    });
  });

  describe('GET /leads/stats', () => {
    it('zero-state — all counts 0, perDay is 30 zero-filled buckets, topCountries is []', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/leads/stats')
        .expect(200);

      expect(res.body.total).toBe(0);
      expect(res.body.today).toBe(0);
      expect(res.body.last7d).toBe(0);
      expect(res.body.last30d).toBe(0);
      expect(res.body.topCountries).toEqual([]);

      expect(Array.isArray(res.body.perDay)).toBe(true);
      expect(res.body.perDay).toHaveLength(30);
      for (const bucket of res.body.perDay) {
        expect(bucket).toEqual(
          expect.objectContaining({
            date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            count: 0,
          }),
        );
      }

      // buckets should be in chronological order (oldest first, newest last)
      const dates: string[] = res.body.perDay.map((b: { date: string }) => b.date);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    });

    it('counts totals and rolling windows correctly', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      await seed(prisma, [
        { businessEmail: 'a@e.com', createdAt: oneHourAgo },     // today + 7d + 30d
        { businessEmail: 'b@e.com', createdAt: fourDaysAgo },    // 7d + 30d
        { businessEmail: 'c@e.com', createdAt: tenDaysAgo },     // 30d only
        { businessEmail: 'd@e.com', createdAt: fortyDaysAgo },   // total only
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/leads/stats')
        .expect(200);

      expect(res.body.total).toBe(4);
      expect(res.body.today).toBe(1);
      expect(res.body.last7d).toBe(2);
      expect(res.body.last30d).toBe(3);
    });

    it('perDay buckets by day — zeros everywhere except seeded days', async () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      await seed(prisma, [
        { businessEmail: 'a1@e.com', createdAt: twoDaysAgo },
        { businessEmail: 'a2@e.com', createdAt: twoDaysAgo },
        { businessEmail: 'a3@e.com', createdAt: twoDaysAgo },
        { businessEmail: 'b1@e.com', createdAt: fiveDaysAgo },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/leads/stats')
        .expect(200);

      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const buckets: { date: string; count: number }[] = res.body.perDay;
      const byDate = Object.fromEntries(buckets.map((b) => [b.date, b.count]));

      expect(byDate[iso(twoDaysAgo)]).toBe(3);
      expect(byDate[iso(fiveDaysAgo)]).toBe(1);

      // everything else in the window is 0
      const total = buckets.reduce((s, b) => s + b.count, 0);
      expect(total).toBe(4);
    });

    it('topCountries sorted desc and capped at 6', async () => {
      // 8 distinct countries with varying counts
      const plan: Array<{ country: string; n: number }> = [
        { country: 'US', n: 10 },
        { country: 'GB', n: 7 },
        { country: 'DE', n: 5 },
        { country: 'FR', n: 4 },
        { country: 'IT', n: 3 },
        { country: 'ES', n: 2 },
        { country: 'NL', n: 1 }, // should be cut off (7th by rank)
        { country: 'BE', n: 1 }, // should be cut off (8th)
      ];
      const rows: Parameters<typeof seed>[1] = [];
      let idx = 0;
      for (const p of plan) {
        for (let i = 0; i < p.n; i++) {
          rows.push({ country: p.country, businessEmail: `u${idx++}@e.com` });
        }
      }
      await seed(prisma, rows);

      const res = await request(app.getHttpServer())
        .get('/api/leads/stats')
        .expect(200);

      const top: { country: string; count: number }[] = res.body.topCountries;
      expect(top).toHaveLength(6);
      // sorted desc
      for (let i = 1; i < top.length; i++) {
        expect(top[i - 1].count).toBeGreaterThanOrEqual(top[i].count);
      }
      expect(top[0]).toEqual({ country: 'US', count: 10 });
      expect(top[1]).toEqual({ country: 'GB', count: 7 });
      // tail countries (NL / BE) must not appear
      const countries = top.map((c) => c.country);
      expect(countries).not.toContain('NL');
      expect(countries).not.toContain('BE');
    });
  });
});
