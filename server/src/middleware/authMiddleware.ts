import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";
import { env } from "../config/env";
import { ADMIN_COOKIE } from "../services/sessionCookie";

interface AdminPayload {
  id: number;
  username: string;
  /** Issued-at in seconds; always set by jsonwebtoken. */
  iat?: number;
}

export interface AuthenticatedRequest
  extends Request {
  admin?: AdminPayload;
}

const JWT_SECRET = env.jwtSecret;

/**
 * True when a token predates the admin's last password change.
 * Compared in whole seconds so a token minted moments after the
 * change is never rejected because of rounding.
 */
function isStaleToken(
  payload: AdminPayload,
  passwordChangedAt: unknown
): boolean {
  if (payload.iat === undefined || !passwordChangedAt) {
    return false;
  }

  const changedAt = new Date(
    passwordChangedAt as string
  ).getTime();

  if (Number.isNaN(changedAt)) {
    return false;
  }

  return payload.iat < Math.floor(changedAt / 1000);
}

/**
 * Extract the session token. The httpOnly cookie is the primary
 * transport (immune to XSS exfiltration); the Authorization header
 * remains supported for programmatic API clients.
 */
function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[ADMIN_COOKIE];

  if (typeof cookieToken === "string" && cookieToken) {
    return cookieToken;
  }

  const authorization = req.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  return scheme === "Bearer" && token ? token : null;
}

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as AdminPayload;

    // Changing a password invalidates previously issued tokens.
    const adminResult = await pool.query(
      `
      SELECT password_changed_at
      FROM admins
      WHERE id = $1
      `,
      [decoded.id]
    );

    const admin = adminResult.rows[0];

    if (
      !admin ||
      isStaleToken(decoded, admin.password_changed_at)
    ) {
      return res.status(401).json({
        success: false,
        message:
          "This session is no longer valid. Please sign in again.",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};