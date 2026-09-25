import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/database";

/**
 * Applies the SQL files in `server/database` to the configured database.
 *
 * Usage:
 *   npm run db:setup          -> schema only
 *   npm run db:seed           -> schema + seed data
 *
 * Both SQL files are idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING),
 * so the script can safely be re-run.
 */

const databaseDir = path.resolve(__dirname, "../../database");

async function applySqlFile(fileName: string): Promise<void> {
  const filePath = path.join(databaseDir, fileName);
  const sql = await readFile(filePath, "utf8");

  await pool.query(sql);

  console.log(`Applied ${fileName}`);
}

const run = async () => {
  const withSeed = process.argv.includes("--seed");

  try {
    await applySqlFile("schema.sql");

    if (withSeed) {
      await applySqlFile("seed.sql");
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
