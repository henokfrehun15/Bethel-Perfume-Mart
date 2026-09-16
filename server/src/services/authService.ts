import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { pool } from "../config/database";

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

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

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