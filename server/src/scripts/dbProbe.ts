/**
 * Database latency probe: measures what a request actually pays when
 * it talks to the database — fresh connection cost (several round
 * trips over the internet) versus warm query round trips. Use this to
 * distinguish "the API is slow" from "the database is far away or
 * cold" (e.g. a suspended Neon compute).
 *
 *   npm run db:probe
 */
import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
    max: 1,
  });

  const started = Date.now();
  await pool.query("SELECT 1");
  console.log(
    `fresh connection + first query: ${Date.now() - started}ms`
  );

  for (let i = 1; i <= 3; i++) {
    const t = Date.now();
    await pool.query("SELECT 1");
    console.log(`warm query ${i}: ${Date.now() - t}ms`);
  }

  try {
    const info = await pool.query(
      `SELECT current_database() AS db,
              inet_server_addr() AS addr`
    );
    console.log("server:", info.rows[0]);
  } catch {
    // Some providers hide server details; not important.
  }

  await pool.end();
}

main().catch((error) => {
  console.error("probe failed:", error.message);
  process.exit(1);
});
