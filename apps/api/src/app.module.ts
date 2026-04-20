import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { CoreModule } from "./core/core.module";

@Module({
  imports: [CoreModule, HealthModule, LeadsModule],
})
export class AppModule {}
