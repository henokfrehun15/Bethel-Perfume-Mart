import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const { poolMock } = vi.hoisted(() => ({
  poolMock: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("../../config/database", () => ({ pool: poolMock }));

import app from "../app";
import { env } from "../../config/env";
import { routeSql, signAdminToken } from "../helpers";

const PASSWORD = "correct-password";

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  poolMock.query.mockReset();

  routeSql(poolMock, [
    // Lookup performed by requireAdmin on every protected request.
    {
      match: /password_changed_at/,
      rows: [{ password_changed_at: null }],
    },
    {
      match: /FROM admins/,
      rows: (_sql, params) =>
        params?.[0] === "admin"
          ? [
              {
                id: 1,
                username: "admin",
                password_hash: passwordHash,
              },
            ]
          : [],
    },
  ]);
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.admin.username).toBe("admin");
  });

  it("rejects a wrong password with 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrong-password" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects an unknown username with 401", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "nobody", password: PASSWORD });

    expect(response.status).toBe(401);
  });

  it("rejects missing credentials with 400", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin" });

    expect(response.status).toBe(400);
  });
});

describe("admin authentication", () => {
  it("rejects requests without a token", async () => {
    const response = await request(app).get("/api/orders/stats");

    expect(response.status).toBe(401);
  });

  it("rejects a malformed token", async () => {
    const response = await request(app)
      .get("/api/orders/stats")
      .set("Authorization", "Bearer not-a-real-token");

    expect(response.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const jwt = await import("jsonwebtoken");

    const wrong = jwt.default.sign(
      { id: 1, username: "admin" },
      "wrong-secret"
    );

    const response = await request(app)
      .get("/api/orders/stats")
      .set("Authorization", `Bearer ${wrong}`);

    expect(response.status).toBe(401);
  });

  it("rejects a token issued before a password change", async () => {
    // One hour old, while the password was changed just now.
    routeSql(poolMock, [
      {
        match: /password_changed_at/,
        rows: [
          {
            password_changed_at: new Date().toISOString(),
          },
        ],
      },
    ]);

    const stale = jwt.sign(
      {
        id: 1,
        username: "admin",
        iat: Math.floor(Date.now() / 1000) - 3600,
      },
      env.jwtSecret,
      { expiresIn: "24h" }
    );

    const response = await request(app)
      .get("/api/orders/stats")
      .set("Authorization", `Bearer ${stale}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain(
      "no longer valid"
    );
  });

  it("accepts a valid admin token", async () => {
    // The stats endpoint needs aggregate rows; route its SQL so the
    // handler responds 200 instead of failing on empty results.
    routeSql(poolMock, [
      // requireAdmin session check still runs first.
      {
        match: /password_changed_at/,
        rows: [{ password_changed_at: null }],
      },
      {
        match: /GROUP BY status/,
        rows: [{ status: "PENDING", count: 3 }],
      },
      {
        match: /WHERE status != 'CANCELLED'/,
        rows: [
          { currency: "ETB", revenue: "5400.00", count: 3 },
        ],
      },
      {
        match: /stock_qty <= 5/,
        rows: [{ count: 1 }],
      },
      {
        match: /FROM orders/,
        rows: [],
      },
    ]);

    const response = await request(app)
      .get("/api/orders/stats")
      .set("Authorization", `Bearer ${signAdminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.total_orders).toBe(3);
    expect(response.body.data.pending_orders).toBe(3);
    expect(response.body.data.low_stock).toBe(1);
  });
});

/*
 * The login limiter allows 10 attempts per IP per 15 minutes.
 * This must stay the last test in the file: earlier login tests
 * already consume part of the shared in-memory budget.
 */
describe("POST /api/auth/login rate limiting", () => {
  it("responds with 429 once the attempt budget is exhausted", async () => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 12; attempt++) {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "wrong-password" });

      statuses.push(response.status);
    }

    expect(statuses).toContain(429);
    expect(statuses[statuses.length - 1]).toBe(429);
  });
});
