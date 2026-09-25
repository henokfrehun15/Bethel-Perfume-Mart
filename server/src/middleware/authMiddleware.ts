import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface AdminPayload {
  id: number;
  username: string;
}

export interface AuthenticatedRequest
  extends Request {
  admin?: AdminPayload;
}

const JWT_SECRET = env.jwtSecret;


export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const [scheme, token] =
      authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization header",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as AdminPayload;

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};