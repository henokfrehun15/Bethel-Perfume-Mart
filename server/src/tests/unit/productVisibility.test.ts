import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { poolMock } = vi.hoisted(() => ({
  poolMock: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("../../config/database", () => ({ pool: poolMock }));

import app from "../app";
import { routeSql, signAdminToken, sqlCalls } from "../helpers";

function routeListing(
  total = 0,
  rows: Record<string, unknown>[] = []
) {
  routeSql(poolMock, [
    { match: /COUNT\(\*\)/, rows: [{ total }] },
    { match: /FROM products/, rows },
  ]);
}

/** SQL statements issued for the products listing. */
function listingStatements(): string[] {
  return sqlCalls(poolMock.query).filter((sql) =>
    /FROM products/.test(sql)
  );
}

beforeEach(() => {
  poolMock.query.mockReset();
  routeListing();
});

describe("product listing visibility", () => {
  it("hides inactive products from the public listing", async () => {
    const response = await request(app).get("/api/products");

    expect(response.status).toBe(200);

    const statements = listingStatements();

    expect(statements.length).toBeGreaterThan(0);

    for (const sql of statements) {
      expect(sql).toContain("p.is_active = TRUE");
    }
  });

  it("ignores includeInactive without a token", async () => {
    await request(app).get("/api/products?includeInactive=true");

    for (const sql of listingStatements()) {
      expect(sql).toContain("p.is_active = TRUE");
    }
  });

  it("ignores includeInactive with an invalid token", async () => {
    await request(app)
      .get("/api/products?includeInactive=true")
      .set("Authorization", "Bearer not-a-real-token");

    for (const sql of listingStatements()) {
      expect(sql).toContain("p.is_active = TRUE");
    }
  });

  it("includes inactive products for a valid admin token", async () => {
    await request(app)
      .get("/api/products?includeInactive=true")
      .set(
        "Authorization",
        `Bearer ${signAdminToken()}`
      );

    const statements = listingStatements();

    expect(statements.length).toBeGreaterThan(0);

    for (const sql of statements) {
      expect(sql).not.toContain("p.is_active = TRUE");
    }
  });
});

describe("GET /api/products/:slug", () => {
  it("returns 404 for a hidden product", async () => {
    routeSql(poolMock, [
      {
        match: /WHERE p\.slug/,
        rows: [
          { id: 7, slug: "amber-perfume", is_active: false },
        ],
      },
      { match: /FROM product_images/, rows: [] },
    ]);

    const response = await request(app).get(
      "/api/products/amber-perfume"
    );

    expect(response.status).toBe(404);
  });

  it("returns an active product", async () => {
    routeSql(poolMock, [
      {
        match: /WHERE p\.slug/,
        rows: [
          { id: 7, slug: "amber-perfume", is_active: true },
        ],
      },
      { match: /FROM product_images/, rows: [] },
    ]);

    const response = await request(app).get(
      "/api/products/amber-perfume"
    );

    expect(response.status).toBe(200);
    expect(
      (response.body as { data: { id: number } }).data.id
    ).toBe(7);
  });
});

describe("GET /api/products/id/:id", () => {
  it("still returns hidden products for the admin edit screen", async () => {
    routeSql(poolMock, [
      {
        match: /WHERE p\.id = \$1/,
        rows: [{ id: 7, is_active: false }],
      },
      { match: /FROM product_images/, rows: [] },
    ]);

    const response = await request(app).get(
      "/api/products/id/7"
    );

    expect(response.status).toBe(200);
    expect(
      (response.body as { data: { is_active: boolean } }).data
        .is_active
    ).toBe(false);
  });
});
