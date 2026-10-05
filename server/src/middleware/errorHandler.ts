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
 * Errors shaped like http-errors (thrown by body-parser, multer, ...):
 * a numeric HTTP status plus an `expose` flag marking the message safe
 * to show to clients.
 */
interface HttpErrorLike {
  status?: unknown;
  statusCode?: unknown;
  expose?: unknown;
  message?: unknown;
}

/**
 * Centralized error handler.
 *
 * Express 5 forwards rejected promises from async handlers here, so any
 * unexpected failure returns a consistent JSON envelope instead of an HTML
 * stack trace (which would also leak internals in production).
 *
 * Errors that carry an HTTP status (a malformed JSON body is a 400, not a
 * server bug) keep it; anything else is treated as an unexpected 500.
 * Client-visible messages follow the http-errors `expose` convention, so
 * 5xx details never leave the server.
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

  const httpError = (error ?? {}) as HttpErrorLike;

  const rawStatus =
    typeof httpError.status === "number"
      ? httpError.status
      : typeof httpError.statusCode === "number"
        ? httpError.statusCode
        : 500;

  // Only trust statuses Express can actually send.
  const status =
    Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599
      ? rawStatus
      : 500;

  const message =
    status < 500 &&
    httpError.expose === true &&
    typeof httpError.message === "string" &&
    httpError.message.trim()
      ? httpError.message
      : "Something went wrong. Please try again.";

  res.status(status).json({
    success: false,
    message,
  });
};
