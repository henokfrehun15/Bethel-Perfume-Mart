import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Pool, PoolClient } from "pg";

/**
 * Versioned SQL migrations.
 *
 * Files live in `server/database/migrations` and are named
 * `NNNN_description.sql`. Each file runs exactly once, inside its own
 * transaction, and is recorded in the `schema_migrations` table.
 *
 * To change the schema, add a new numbered file — never edit a
 * migration that has already been applied somewhere.
 */

// npm scripts and vitest both run with the server package directory
// as the working directory.
const migrationsDir = path.resolve(
  process.cwd(),
  "database/migrations"
);

export interface MigrationResult {
  /** Migration files applied by this run. */
  applied: string[];
  /** Migration files found but not yet applied. */
  pending: string[];
}

export async function runMigrations(
  pool: Pool
): Promise<MigrationResult> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedResult = await pool.query(
    "SELECT name FROM schema_migrations"
  );

  const applied = new Set<string>(
    appliedResult.rows.map((row) => row.name as string)
  );

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const pending = files.filter((file) => !applied.has(file));
  const appliedNow: string[] = [];

  for (const file of pending) {
    const sql = await readFile(
      path.join(migrationsDir, file),
      "utf8"
    );

    let client: PoolClient | null = null;

    try {
      client = await pool.connect();

      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (name) VALUES ($1)",
        [file]
      );
      await client.query("COMMIT");
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK");
      }

      throw new Error(
        `Migration ${file} failed: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    } finally {
      client?.release();
    }

    appliedNow.push(file);

    console.log(`Applied ${file}`);
  }

  if (appliedNow.length === 0) {
    console.log("No pending migrations.");
  }

  return { applied: appliedNow, pending };
}
