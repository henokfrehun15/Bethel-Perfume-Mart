import bcrypt from "bcrypt";
import { pool } from "../config/database";

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error(
    "Usage: npm run create-admin <username> <password>"
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error(
    "Password must be at least 8 characters long"
  );
  process.exit(1);
}

const createAdmin = async () => {
  try {
    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    await pool.query(
      `
      INSERT INTO admins (
        username,
        password_hash
      )
      VALUES ($1, $2)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = CURRENT_TIMESTAMP
      `,
      [username, passwordHash]
    );

    console.log(
      `Admin "${username}" created/updated successfully.`
    );
  } catch (error) {
    console.error(
      "Failed to create admin:",
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

createAdmin();