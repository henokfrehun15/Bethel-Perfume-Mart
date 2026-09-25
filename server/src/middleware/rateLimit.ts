import { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  /** Length of the window in milliseconds. */
  windowMs: number;
  /** Maximum number of requests allowed per window and per client. */
  max: number;
  /** Message returned with HTTP 429. */
  message?: string;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/**
 * Small, dependency-free fixed-window rate limiter.
 *
 * Intended for a single API instance (brute-force protection on the admin
 * login endpoint). Storage is in-memory, so it resets on restart and is not
 * shared between instances — swap in a Redis-backed limiter if the API is
 * ever scaled horizontally.
 */
export const rateLimit =
  ({ windowMs, max, message }: RateLimitOptions) => {
    const buckets = new Map<string, RateLimitBucket>();

    // Periodically drop expired buckets so the map cannot grow forever.
    const cleanup = setInterval(() => {
      const now = Date.now();

      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(key);
        }
      }
    }, windowMs);

    // Never keep the process alive just for cleanup.
    cleanup.unref();

    return (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const key =
        req.ip || req.socket.remoteAddress || "unknown";

      const now = Date.now();
      const bucket = buckets.get(key);

      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, {
          count: 1,
          resetAt: now + windowMs,
        });

        return next();
      }

      bucket.count += 1;

      if (bucket.count > max) {
        const retryAfterSeconds = Math.ceil(
          (bucket.resetAt - now) / 1000
        );

        res.setHeader("Retry-After", String(retryAfterSeconds));

        return res.status(429).json({
          success: false,
          message:
            message ||
            "Too many requests. Please try again later.",
        });
      }

      return next();
    };
  };
