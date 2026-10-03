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

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),

  port: port("PORT", 5000),

  clientUrl: optional("CLIENT_URL", "http://localhost:3000"),

  databaseUrl: required("DATABASE_URL"),
  databaseSsl: flag("DATABASE_SSL", true),

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "1d"),

  trustProxy: flag("TRUST_PROXY", false),

  whatsappNumber: optional("WHATSAPP_NUMBER", ""),
  whatsappApiUrl: optional("WHATSAPP_API_URL", ""),
  whatsappApiToken: optional("WHATSAPP_API_TOKEN", ""),

  // Where uploaded product images are written. Relative paths resolve
  // from the server package directory (server/uploads by default).
  uploadDir: optional("UPLOAD_DIR", "uploads"),
  uploadMaxBytes: positiveInt("UPLOAD_MAX_BYTES", 5_000_000),
  // Absolute base for uploaded image URLs. When empty the server
  // derives it from the incoming request, which works behind a proxy
  // as long as TRUST_PROXY is enabled.
  publicAssetUrl: optional("PUBLIC_ASSET_URL", ""),
};

export const isProduction = env.nodeEnv === "production";
