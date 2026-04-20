import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { PrismaService } from "../../core/database/prisma.service";
import { CreateLeadDto } from "./dto/create-lead.dto";

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
}
