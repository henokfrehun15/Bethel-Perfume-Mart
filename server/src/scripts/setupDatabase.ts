import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/database";
import { runMigrations } from "./migrations";

/**
 * Applies pending SQL migrations (and optionally the demo seed data)
 * to the configured database.
 *
 * Usage:
 *   npm run db:migrate        -> migrations only (db:setup is an alias)
 *   npm run db:seed           -> migrations + seed data
 *
 * Migrations are tracked in `schema_migrations`, so every file runs
 * exactly once. The seed file is idempotent (ON CONFLICT DO NOTHING).
 */

const databaseDir = path.resolve(process.cwd(), "database");

async function applySeed(): Promise<void> {
  const filePath = path.join(databaseDir, "seed.sql");
  const sql = await readFile(filePath, "utf8");

  await pool.query(sql);

  console.log("Applied seed.sql");
}

const run = async () => {
  const withSeed = process.argv.includes("--seed");

  try {
    await runMigrations(pool);

    if (withSeed) {
      await applySeed();
    }

    console.log("Database is ready.");
  } catch (error) {
    console.error("Database setup failed:", error);

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

void run();
