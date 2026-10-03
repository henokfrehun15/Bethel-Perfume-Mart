import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { pool } from "../config/database";
import { env } from "../config/env";

interface AdminPayload {
  id: number;
  username: string;
}

interface LoginResult {
  token: string;
  admin: {
    id: number;
    username: string;
  };
}

const JWT_SECRET = env.jwtSecret;
const JWT_EXPIRES_IN = env.jwtExpiresIn;

/** Mint a signed session token for an admin. */
export const signAdminToken = (
  payload: AdminPayload
): string => {
  // Explicitly cast expiresIn so TypeScript recognizes it as valid SignOptions
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
};


export const loginAdmin = async (
  username: string,
  password: string
): Promise<LoginResult | null> => {
  const result = await pool.query(
    `
    SELECT
      id,
      username,
      password_hash
    FROM admins
    WHERE username = $1
    `,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const admin = result.rows[0];

  const passwordMatches = await bcrypt.compare(
    password,
    admin.password_hash
  );

  if (!passwordMatches) {
    return null;
  }

  const payload: AdminPayload = {
    id: admin.id,
    username: admin.username,
  };

  return {
    token: signAdminToken(payload),
    admin: {
      id: admin.id,
      username: admin.username,
    },
  };
};

export const hashPassword = async (
  password: string
): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/** Check an admin's current password without exposing the hash. */
export const verifyAdminPassword = async (
  adminId: number,
  password: string
): Promise<boolean> => {
  const result = await pool.query(
    `
    SELECT password_hash
    FROM admins
    WHERE id = $1
    `,
    [adminId]
  );

  const admin = result.rows[0];

  if (!admin) {
    return false;
  }

  return bcrypt.compare(password, admin.password_hash);
};

/**
 * Replace an admin's password and stamp the change so that tokens
 * issued before now are rejected by the auth middleware.
 */
export const updateAdminPassword = async (
  adminId: number,
  newPassword: string
): Promise<boolean> => {
  const passwordHash = await hashPassword(newPassword);

  const result = await pool.query(
    `
    UPDATE admins
    SET
      password_hash = $1,
      password_changed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id
    `,
    [passwordHash, adminId]
  );

  return result.rows.length > 0;
};