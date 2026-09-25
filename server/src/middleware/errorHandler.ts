import { NextFunction, Request, Response } from "express";

/**
 * 404 handler for unmatched routes.
 * Must be registered after every route.
 */
export const notFoundHandler = (
  req: Request,
  res: Response
) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

/**
 * Centralized error handler.
 *
 * Express 5 forwards rejected promises from async handlers here, so any
 * unexpected failure returns a consistent JSON envelope instead of an HTML
 * stack trace (which would also leak internals in production).
 */
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // If the response already started streaming we must delegate to Express.
  if (res.headersSent) {
    return next(error);
  }

  console.error("Unhandled request error:", error);

  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
  });
};
