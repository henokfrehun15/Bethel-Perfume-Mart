import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

import { env } from "../config/env";

interface RateLimitOptions {
  /**
   * Unique limiter name. Several limiters can share a window length,
   * so the name keeps their counters separate — especially important
   * for the Redis store, where counters live in one shared keyspace.
   */
  name?: string;
  /** Length of the window in milliseconds. */
  windowMs: number;
  /** Maximum number of requests allowed per window and per client. */
  max: number;
  /** Message returned with HTTP 429. */
  message?: string;
  /** Test seam: use a custom store instead of the configured default. */
  store?: RateLimitStore;
}

interface RateLimitResult {
  /** Hits inside the current window, including this one. */
  count: number;
  /** Epoch milliseconds when the window resets. */
  resetAt: number;
}

export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<RateLimitResult>;
}

/** The tiny slice of a Redis client the limiter needs. */
export interface EvalClient {
  eval(...args: unknown[]): Promise<unknown>;
}

/**
 * Fixed-window counters in memory. The default for single-instance
 * deployments: no external dependency, but counters reset on restart
 * and are not shared between processes.
 */
export class MemoryStore implements RateLimitStore {
  private buckets = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(windowMs: number) {
    // Periodically drop expired buckets so the map cannot grow forever.
    const cleanup = setInterval(() => {
      const now = Date.now();

      for (const [key, bucket] of this.buckets) {
        if (bucket.resetAt <= now) {
          this.buckets.delete(key);
        }
      }
    }, windowMs);

    // Never keep the process alive just for cleanup.
    cleanup.unref();
  }

  async hit(
    key: string,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      const fresh = {
        count: 1,
        resetAt: now + windowMs,
      };

      this.buckets.set(key, fresh);

      return fresh;
    }

    bucket.count += 1;

    return bucket;
  }
}

/**
 * Atomic INCR + PEXPIRE: the key is created with a TTL exactly once
 * (on the first hit of a window), so the window cannot lose its TTL
 * to a race between processes.
 */
const WINDOW_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { count, ttl }
`;

/**
 * Fixed-window counters in Redis. Set REDIS_URL to enable: counters
 * are then shared by every API instance, which is what horizontal
 * scaling needs.
 */
export class RedisStore implements RateLimitStore {
  private client: EvalClient | null = null;

  constructor(
    /** Injectable for tests; production lazily connects to REDIS_URL. */
    private readonly injectedClient?: EvalClient
  ) {}

  private async getClient(): Promise<EvalClient> {
    if (this.injectedClient) {
      return this.injectedClient;
    }

    let client = this.client;

    if (!client) {
      // Loaded lazily so deployments without REDIS_URL never import
      // or connect to Redis.
      const { Redis } = await import("ioredis");

      const connection = new Redis(env.redisUrl, {
        maxRetriesPerRequest: 2,
      });

      connection.on("error", (error: Error) => {
        console.error("Rate limiter Redis error:", error);
      });

      client = connection;
      this.client = client;
    }

    return client;
  }

  async hit(
    key: string,
    windowMs: number
  ): Promise<RateLimitResult> {
    const client = await this.getClient();

    const [count, ttl] = (await client.eval(
      WINDOW_SCRIPT,
      1,
      key,
      windowMs
    )) as [number, number];

    return {
      count,
      resetAt: Date.now() + Math.max(ttl, 0),
    };
  }
}

function defaultStore(
  name: string,
  windowMs: number
): RateLimitStore {
  return env.redisUrl
    ? new RedisStore()
    : new MemoryStore(windowMs);
}

/**
 * Fixed-window rate limiter per client IP.
 *
 * Counters live in memory by default or in Redis when REDIS_URL is
 * set (shared between instances). If the store fails — for example a
 * Redis outage — requests are allowed through: a limiter outage must
 * not take the whole API down with it.
 */
export const rateLimit =
  ({
    name,
    windowMs,
    max,
    message,
    store,
  }: RateLimitOptions) => {
    const prefix = `rl:${name ?? randomUUID()}`;
    const activeStore =
      store ?? defaultStore(name ?? prefix, windowMs);

    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const key =
        req.ip || req.socket.remoteAddress || "unknown";

      try {
        const { count, resetAt } =
          await activeStore.hit(
            `${prefix}:${key}`,
            windowMs
          );

        if (count > max) {
          const retryAfterSeconds = Math.max(
            1,
            Math.ceil((resetAt - Date.now()) / 1000)
          );

          res.setHeader(
            "Retry-After",
            String(retryAfterSeconds)
          );

          return res.status(429).json({
            success: false,
            message:
              message ||
              "Too many requests. Please try again later.",
          });
        }

        return next();
      } catch (error) {
        console.error(
          "Rate limiter store failure (allowing request):",
          error
        );

        return next();
      }
    };
  };
