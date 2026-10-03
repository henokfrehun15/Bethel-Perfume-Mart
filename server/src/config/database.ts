import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl
    ? { rejectUnauthorized: false }
    : undefined,

  // Managed providers (Neon, Supabase, ...) are reached over the
  // internet. Establishing a connection costs several round trips
  // (~2-3s to a distant region), and Neon additionally suspends the
  // compute after ~5 idle minutes, turning the next connection into
  // a cold boot that can take tens of seconds. The pg default
  // (10s idle timeout) throws connections away between clicks, so
  // requests keep paying the reconnect cost; hold them warm instead,
  // but always shorter than the provider's own idle drop.
  max: 10,
  idleTimeoutMillis: 240_000,

  // Fail fast when the pool cannot provide a connection instead of
  // queueing forever (callers already translate this into a 503).
  connectionTimeoutMillis: 10_000,

  // Detect half-open sockets instead of hanging on them.
  keepAlive: true,
  keepAliveInitialDelayMillis: 30_000,
});

/*
 * Keep the database warm. Neon suspends idle computes; a periodic
 * ping keeps the first real request from paying a multi-second cold
 * boot (and keeps one pooled connection alive). Set DB_KEEP_ALIVE_MS=0
 * to disable — e.g. to preserve compute hours on Neon's free plan.
 */
if (env.dbKeepAliveMs > 0) {
  const keepAlive = setInterval(() => {
    pool.query("SELECT 1").catch((error) => {
      console.error(
        "Database keep-alive failed:",
        error instanceof Error ? error.message : error
      );
    });
  }, env.dbKeepAliveMs);

  // Never keep the process alive just for the ping.
  keepAlive.unref();
}

