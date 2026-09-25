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

  // Explicitly cast expiresIn so TypeScript recognizes it as valid SignOptions
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

  return {
    token,
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