/**
 * Runs before every test file.
 *
 * `src/config/env.ts` throws when required variables are missing, so
 * provide safe defaults first (CI has no .env file). dotenv never
 * overrides variables that are already set.
 *
 * Unit tests mock the database pool entirely. Integration tests point
 * the pool at TEST_DATABASE_URL through a module mock — DATABASE_URL
 * here is only a placeholder so env.ts can load.
 */
process.env.DATABASE_URL ??=
  "postgresql://test:test@127.0.0.1:5432/bethel_unit_test";

process.env.JWT_SECRET ??= "test-secret";
process.env.JWT_EXPIRES_IN ??= "1h";
process.env.CLIENT_URL ??= "http://localhost:3000";
process.env.NODE_ENV = "test";

// Upload tests must not write into the real upload directory.
process.env.UPLOAD_DIR ??= ".tmp-test-uploads";

// Tests must never call the real WhatsApp webhook, even when the
// developer's .env configures one. Assigning "" (a defined value)
// also stops dotenv from filling it in from .env.
process.env.WHATSAPP_API_URL = "";
