import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

const { poolMock } = vi.hoisted(() => ({
  poolMock: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("../../config/database", () => ({ pool: poolMock }));

import app from "../app";
import { routeSql, signAdminToken } from "../helpers";

const CURRENT_PASSWORD = "current-password";
const NEW_PASSWORD = "a-brand-new-password";

let currentHash: string;

beforeAll(async () => {
  currentHash = await bcrypt.hash(CURRENT_PASSWORD, 4);
});

beforeEach(() => {
  poolMock.query.mockReset();

  routeSql(poolMock, [
    // requireAdmin session check.
    {
      match: /password_changed_at/,
      rows: [{ password_changed_at: null }],
    },
    // verifyAdminPassword lookup.
    {
      match: /SELECT\s+password_hash/,
      rows: [{ password_hash: currentHash }],
    },
    // updateAdminPassword write.
    { match: /UPDATE admins/, rows: [{ id: 1 }] },
  ]);
});

describe("PUT /api/auth/password", () => {
  it("requires authentication", async () => {
    const response = await request(app)
      .put("/api/auth/password")
      .send({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

    expect(response.status).toBe(401);
  });

  it("rejects an incorrect current password without writing", async () => {
    const response = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({
        currentPassword: "not-the-password",
        newPassword: NEW_PASSWORD,
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain("incorrect");

    const updates = poolMock.query.mock.calls.filter((call) =>
      /UPDATE admins/.test(String(call[0]))
    );

    expect(updates).toHaveLength(0);
  });

  it("refuses to reuse the current password", async () => {
    const response = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({
        currentPassword: CURRENT_PASSWORD,
        newPassword: CURRENT_PASSWORD,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("different");
  });

  it("validates the new password length", async () => {
    const response = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({
        currentPassword: CURRENT_PASSWORD,
        newPassword: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Validation failed");
  });

  it("stores a bcrypt hash of the new password and stamps the change", async () => {
    const response = await request(app)
      .put("/api/auth/password")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const update = poolMock.query.mock.calls.find((call) =>
      /UPDATE admins/.test(String(call[0]))
    );

    expect(update).toBeDefined();

    const [storedHash, adminId] = update![1] as [string, number];

    expect(adminId).toBe(1);

    // A bcrypt hash of the NEW password (never the plaintext).
    expect(storedHash).not.toBe(NEW_PASSWORD);
    expect(await bcrypt.compare(NEW_PASSWORD, storedHash)).toBe(true);

    // The change is stamped so older tokens stop working.
    expect(String(update![0])).toContain(
      "password_changed_at = CURRENT_TIMESTAMP"
    );
  });
});