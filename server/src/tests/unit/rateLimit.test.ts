import { describe, expect, it, vi } from "vitest";

import {
  rateLimit,
  RedisStore,
  type EvalClient,
} from "../../middleware/rateLimit";
import { createResponse } from "../helpers";

function createRequest(ip = "10.0.0.1") {
  return { ip, socket: { remoteAddress: ip } } as never;
}

/** The middleware is typed against Express' Request/Response/NextFunction. */
async function callLimiter(
  limiter: ReturnType<typeof rateLimit>,
  ip: string,
  res: ReturnType<typeof createResponse>,
  next: ReturnType<typeof vi.fn>
) {
  await limiter(
    createRequest(ip),
    res as never,
    next as never
  );
}

describe("rateLimit middleware", () => {
  it("allows requests up to the configured maximum", async () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 2,
      message: "slow down",
    });

    const next = vi.fn();

    await callLimiter(limiter, "10.0.0.1", createResponse(), next);
    await callLimiter(limiter, "10.0.0.1", createResponse(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("responds with 429 and Retry-After once the maximum is exceeded", async () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
      message: "slow down",
    });

    const next = vi.fn();

    await callLimiter(limiter, "10.0.0.2", createResponse(), next);

    const res = createResponse();

    await callLimiter(limiter, "10.0.0.2", res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "slow down",
    });
    expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("tracks clients independently", async () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
    });

    const next = vi.fn();

    await callLimiter(limiter, "10.0.0.3", createResponse(), next);

    const other = createResponse();
    await callLimiter(limiter, "10.0.0.4", other, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(other.statusCode).toBe(200);
  });

  it("uses a generic message when none is provided", async () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
    });

    const next = vi.fn();

    // The first request of a window always opens the bucket; `max`
    // requests are allowed and the next one is rejected.
    await callLimiter(
      limiter,
      "10.0.0.5",
      createResponse(),
      next
    );

    const res = createResponse();

    await callLimiter(limiter, "10.0.0.5", res, next);

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  });
});

/** Scripted Redis client: counts up per key and remembers the eval calls. */
function fakeRedisClient(): EvalClient & {
  calls: unknown[][];
} {
  const counts = new Map<string, number>();
  const calls: unknown[][] = [];

  return {
    calls,
    async eval(...args: unknown[]) {
      calls.push(args);

      // eval(script, numKeys, key, windowMs)
      const key = String(args[2]);
      const count = (counts.get(key) ?? 0) + 1;

      counts.set(key, count);

      return [count, 60_000];
    },
  };
}

describe("Redis store", () => {
  it("counts hits atomically through one eval per request", async () => {
    const client = fakeRedisClient();
    const store = new RedisStore(client);

    const first = await store.hit("rl:login:10.0.0.1", 60_000);
    const second = await store.hit("rl:login:10.0.0.1", 60_000);

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
    expect(first.resetAt).toBeGreaterThan(Date.now());
    expect(client.calls).toHaveLength(2);

    // eval(script, numKeys, key, windowMs)
    expect(client.calls[0]).toHaveLength(4);
    expect(client.calls[0]![2]).toBe("rl:login:10.0.0.1");
    expect(client.calls[0]![3]).toBe(60_000);
  });

  it("backs the middleware and rejects requests past the maximum", async () => {
    const limiter = rateLimit({
      name: "login",
      windowMs: 60_000,
      max: 1,
      message: "slow down",
      store: new RedisStore(fakeRedisClient()),
    });

    const next = vi.fn();

    await callLimiter(limiter, "10.0.0.6", createResponse(), next);

    const res = createResponse();

    await callLimiter(limiter, "10.0.0.6", res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(429);
    expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("fails open when the store is unreachable", async () => {
    const broken: EvalClient = {
      async eval() {
        throw new Error("connection refused");
      },
    };

    const limiter = rateLimit({
      name: "login",
      windowMs: 60_000,
      max: 1,
      store: new RedisStore(broken),
    });

    const next = vi.fn();

    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      await callLimiter(limiter, "10.0.0.7", createResponse(), next);
      await callLimiter(limiter, "10.0.0.7", createResponse(), next);
      await callLimiter(limiter, "10.0.0.7", createResponse(), next);

      // A limiter outage must never block the API itself.
      expect(next).toHaveBeenCalledTimes(3);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
