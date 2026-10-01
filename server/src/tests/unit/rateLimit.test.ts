import { describe, expect, it, vi } from "vitest";

import { rateLimit } from "../../middleware/rateLimit";
import { createResponse } from "../helpers";

function createRequest(ip = "10.0.0.1") {
  return { ip, socket: { remoteAddress: ip } } as never;
}

/** The middleware is typed against Express' Request/Response/NextFunction. */
function callLimiter(
  limiter: ReturnType<typeof rateLimit>,
  ip: string,
  res: ReturnType<typeof createResponse>,
  next: ReturnType<typeof vi.fn>
) {
  limiter(
    createRequest(ip),
    res as never,
    next as never
  );
}

describe("rateLimit middleware", () => {
  it("allows requests up to the configured maximum", () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 2,
      message: "slow down",
    });

    const next = vi.fn();

    callLimiter(limiter, "10.0.0.1", createResponse(), next);
    callLimiter(limiter, "10.0.0.1", createResponse(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("responds with 429 and Retry-After once the maximum is exceeded", () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
      message: "slow down",
    });

    const next = vi.fn();

    callLimiter(limiter, "10.0.0.2", createResponse(), next);

    const res = createResponse();

    callLimiter(limiter, "10.0.0.2", res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "slow down",
    });
    expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("tracks clients independently", () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
    });

    const next = vi.fn();

    callLimiter(limiter, "10.0.0.3", createResponse(), next);

    const other = createResponse();
    callLimiter(limiter, "10.0.0.4", other, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(other.statusCode).toBe(200);
  });

  it("uses a generic message when none is provided", () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
    });

    const next = vi.fn();

    // The first request of a window always opens the bucket; `max`
    // requests are allowed and the next one is rejected.
    callLimiter(
      limiter,
      "10.0.0.5",
      createResponse(),
      next
    );

    const res = createResponse();

    callLimiter(limiter, "10.0.0.5", res, next);

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  });
});
