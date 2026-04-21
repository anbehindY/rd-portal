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
});
