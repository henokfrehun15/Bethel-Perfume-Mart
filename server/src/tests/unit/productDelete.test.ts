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
import { signAdminToken } from "../helpers";

/** Postgres error with an error code, as `pg` raises it. */
function pgError(code: string): Error {
  const error = new Error(
    'update or delete on table violates RESTRICT setting of foreign key constraint'
  ) as Error & { code: string };

  error.code = code;

  return error;
}

/**
 * Mock the delete flow. `deleteResult` decides what the DELETE itself
 * does: throw a coded error, or return rows (empty rows = not found).
 * The product pre-select returns an external image URL so the
 * best-effort file cleanup is skipped.
 */
function mockDeleteFlow(
  deleteResult: { rows: Record<string, unknown>[] } | { error: Error }
) {
  poolMock.query.mockImplementation(async (sql: string) => {
    // requireAdmin checks the token against the admins table.
    if (/FROM admins/.test(sql)) {
      return {
        rows: [{ password_changed_at: null }],
        rowCount: 1,
      };
    }

    if (/DELETE FROM products/.test(sql)) {
      if ("error" in deleteResult) {
        throw deleteResult.error;
      }

      return {
        rows: deleteResult.rows,
        rowCount: deleteResult.rows.length,
      };
    }

    if (/FROM product_images/.test(sql)) {
      return {
        rows: [{ url: "https://images.example.com/bottle.jpg" }],
        rowCount: 1,
      };
    }

    return { rows: [], rowCount: 0 };
  });
}

function deleteProduct(id: string) {
  return request(app)
    .delete(`/api/products/${id}`)
    .set("Authorization", `Bearer ${signAdminToken()}`);
}

beforeEach(() => {
  poolMock.query.mockReset();
});

describe("DELETE /api/products/:id", () => {
  it("returns 409 with the hide-instead message for a RESTRICT violation (23001)", async () => {
    mockDeleteFlow({ error: pgError("23001") });

    const response = await deleteProduct("7");

    expect(response.status).toBe(409);
    expect(
      (response.body as { message: string }).message
    ).toContain("cannot be deleted");
  });

  it("still returns 409 for the classic foreign key violation (23503)", async () => {
    mockDeleteFlow({ error: pgError("23503") });

    const response = await deleteProduct("7");

    expect(response.status).toBe(409);
    expect(
      (response.body as { message: string }).message
    ).toContain("cannot be deleted");
  });

  it("deletes an unreferenced product", async () => {
    mockDeleteFlow({ rows: [{ id: 7 }] });

    const response = await deleteProduct("7");

    expect(response.status).toBe(200);
    expect(
      (response.body as { message: string }).message
    ).toContain("deleted successfully");
  });

  it("returns 404 when the product does not exist", async () => {
    mockDeleteFlow({ rows: [] });

    const response = await deleteProduct("7");

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/categories/:id", () => {
  it("returns 400 with a friendly message for a RESTRICT violation (23001)", async () => {
    poolMock.query.mockImplementation(async (sql: string) => {
      if (/FROM admins/.test(sql)) {
        return {
          rows: [{ password_changed_at: null }],
          rowCount: 1,
        };
      }

      if (/DELETE FROM categories/.test(sql)) {
        throw pgError("23001");
      }

      return { rows: [], rowCount: 0 };
    });

    const response = await request(app)
      .delete("/api/categories/3")
      .set("Authorization", `Bearer ${signAdminToken()}`);

    expect(response.status).toBe(400);
    expect((response.body as { message: string }).message).toContain(
      "contains products"
    );
  });
});
