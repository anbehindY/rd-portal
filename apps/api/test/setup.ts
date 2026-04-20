// Shared e2e setup. Per-test DB truncation and app lifecycle live inside each
// spec (they need the per-spec Nest app's PrismaService). This file just
// guarantees env vars and NODE_ENV are sane before the Nest app boots.
//
// `@nestjs/config`'s ConfigModule loads `apps/api/.env` automatically when the
// app is created (jest runs with cwd = apps/api). CI provides DATABASE_URL via
// the job env. Either way, by the time the first Nest module is constructed
// the required vars are in `process.env`.

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
