import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PinoLogger } from "nestjs-pino";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { ListLeadsDto } from "./dto/list-leads.dto";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PAGE_SIZE = 100;
const PER_DAY_WINDOW = 30;
const TOP_COUNTRIES = 6;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LeadsService.name);
  }

  async create(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({ data: dto });
    this.logger.info(
      { leadId: lead.id, country: lead.country },
      "lead.created",
    );
    return { id: lead.id, createdAt: lead.createdAt };
  }

  async list({ page, pageSize, q }: ListLeadsDto) {
    const take = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * take;

    const where: Prisma.LeadWhereInput | undefined = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { businessEmail: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { items, total, page: currentPage, pageSize: take };
  }

  async stats() {
    const now = new Date();
    const since24h = new Date(now.getTime() - DAY_MS);
    const since7d = new Date(now.getTime() - 7 * DAY_MS);
    const since30d = new Date(now.getTime() - 30 * DAY_MS);

    // perDay window: 30 UTC calendar days ending with today (inclusive).
    const todayUtcMs = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const windowStart = new Date(todayUtcMs - (PER_DAY_WINDOW - 1) * DAY_MS);

    const [total, today, last7d, last30d, perDayRaw, topCountriesRaw] =
      await this.prisma.$transaction([
        this.prisma.lead.count(),
        this.prisma.lead.count({ where: { createdAt: { gte: since24h } } }),
        this.prisma.lead.count({ where: { createdAt: { gte: since7d } } }),
        this.prisma.lead.count({ where: { createdAt: { gte: since30d } } }),
        this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
          SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
                 COUNT(*)::bigint AS count
          FROM "Lead"
          WHERE "createdAt" >= ${windowStart}
          GROUP BY day
          ORDER BY day ASC
        `,
        this.prisma.lead.groupBy({
          by: ["country"],
          _count: true,
          orderBy: { _count: { country: "desc" } },
          take: TOP_COUNTRIES,
        }),
      ]);

    const byDate = new Map<string, number>();
    for (const row of perDayRaw) byDate.set(row.day, Number(row.count));

    const perDay: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < PER_DAY_WINDOW; i++) {
      const d = new Date(windowStart.getTime() + i * DAY_MS);
      const iso = d.toISOString().slice(0, 10);
      perDay.push({ date: iso, count: byDate.get(iso) ?? 0 });
    }

    const topCountries = topCountriesRaw.map((row) => ({
      country: row.country,
      count: row._count,
    }));

    return { total, today, last7d, last30d, perDay, topCountries };
  }
}
