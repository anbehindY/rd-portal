import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express from "express";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { EnvVars } from "./core/config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.setGlobalPrefix("api");

  const config = app.get(ConfigService<EnvVars, true>);
  // CSRF: API is stateless (no cookies/sessions) + CORS origin-restricted with
  // credentials:false, which mitigates CSRF. If auth cookies are ever added,
  // wire up CSRF token middleware (e.g. csurf or double-submit cookie) here.
  app.enableCors({
    origin: config.get("CORS_ORIGIN", { infer: true }),
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  await app.listen(config.get("PORT", { infer: true }));
}

bootstrap();
