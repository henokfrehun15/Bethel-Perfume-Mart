import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AdminPayload {
  id: number;
  username: string;
}

export interface AuthenticatedRequest
  extends Request {
  admin?: AdminPayload;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

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