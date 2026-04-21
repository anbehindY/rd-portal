import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body() dto: CreateLeadDto) {
    return this.leads.create(dto);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  list(@Query() dto: ListLeadsDto) {
    return this.leads.list(dto);
  }

  @Get('stats')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  stats() {
    return this.leads.stats();
  }
}
