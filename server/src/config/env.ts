import dotenv from "dotenv";

/**
 * Single source of truth for environment variables.
 *
 * `dotenv.config()` is executed exactly once, here, so every other module can
 * safely import `env` without depending on the import order in `server.ts`.
 */

dotenv.config();

function required(key: string): string {
  const value = process.env[key];

  if (!value || !value.trim()) {
    throw new Error(
      `${key} is not defined. Copy server/.env.example to server/.env and fill it in.`
    );
  }

  return value.trim();
}

function optional(key: string, fallback: string): string {
  const value = process.env[key];

  return value && value.trim() ? value.trim() : fallback;
}

function flag(key: string, fallback: boolean): boolean {
  const value = process.env[key]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value);
}

function port(key: string, fallback: number): number {
  const value = Number(process.env[key]);

  return Number.isInteger(value) && value > 0 && value < 65536
    ? value
    : fallback;
}

function positiveInt(
  key: string,
  fallback: number
): number {
  const value = Number(process.env[key]);

  return Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

function nonNegativeInt(
  key: string,
  fallback: number
): number {
  const value = Number(process.env[key]);

  return Number.isInteger(value) && value >= 0
    ? value
    : fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),

  port: port("PORT", 5000),

  clientUrl: optional("CLIENT_URL", "http://localhost:3000"),

  databaseUrl: required("DATABASE_URL"),
  databaseSsl: flag("DATABASE_SSL", true),
  // Keep-alive ping interval for the database pool (milliseconds).
  // Keeps serverless computes (Neon) from suspending and connections
  // from being dropped between requests. 0 disables the ping.
  dbKeepAliveMs: nonNegativeInt("DB_KEEP_ALIVE_MS", 240_000),

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "1d"),

  // SameSite attribute of the admin session cookie. "lax" (default)
  // works when the API and the admin app share a registrable domain;
  // use "none" when they live on different production domains (the
  // cookie is then always Secure, i.e. https-only).
  cookieSameSite: optional("COOKIE_SAME_SITE", "lax"),

  trustProxy: flag("TRUST_PROXY", false),

  // Rate limiter counters live in memory by default. Set REDIS_URL
  // to share counters between API instances (horizontal scaling).
  redisUrl: optional("REDIS_URL", ""),

  whatsappNumber: optional("WHATSAPP_NUMBER", ""),
  whatsappApiUrl: optional("WHATSAPP_API_URL", ""),
  whatsappApiToken: optional("WHATSAPP_API_TOKEN", ""),

  // Where uploaded product images are written. Relative paths resolve
  // from the server package directory (server/uploads by default).
  uploadDir: optional("UPLOAD_DIR", "uploads"),
  uploadMaxBytes: positiveInt("UPLOAD_MAX_BYTES", 5_000_000),
  // Optional absolute base for uploaded image URLs. When empty,
  // uploads are stored as /uploads/... paths that clients resolve
  // against the API origin. Set it only when uploads are served from
  // a separate asset host or CDN.
  publicAssetUrl: optional("PUBLIC_ASSET_URL", ""),

  // Image storage backend: "local" (disk, default), "s3" (S3 and
  // S3-compatible object storage such as R2, MinIO) or "supabase"
  // (Supabase Storage). The s3 driver requires the four S3_*
  // credentials below; the supabase driver requires the three
  // SUPABASE_* values.
  storageDriver: optional("STORAGE_DRIVER", "local"),
  s3Bucket: optional("S3_BUCKET", ""),
  s3Region: optional("S3_REGION", ""),
  s3AccessKeyId: optional("S3_ACCESS_KEY_ID", ""),
  s3SecretAccessKey: optional("S3_SECRET_ACCESS_KEY", ""),
  // Custom endpoint for S3-compatible providers (R2, MinIO, ...).
  s3Endpoint: optional("S3_ENDPOINT", ""),
  // Public base for S3 image URLs. Defaults to the bucket's endpoint
  // URL; set this when serving uploads through a CDN (e.g. CloudFront).
  s3PublicUrl: optional("S3_PUBLIC_URL", ""),
  // Supabase Storage: project URL, service role key (bypasses RLS,
  // server-only) and the public bucket that receives the uploads.
  supabaseUrl: optional("SUPABASE_URL", ""),
  supabaseServiceKey: optional("SUPABASE_SERVICE_KEY", ""),
  supabaseBucket: optional("SUPABASE_BUCKET", ""),
};

export const isProduction = env.nodeEnv === "production";
