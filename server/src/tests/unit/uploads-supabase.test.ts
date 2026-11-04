import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

/**
 * The supabase driver must be active before any module reads env, so
 * the variables are set in a hoisted block (dotenv never overrides
 * values that are already present).
 */
vi.hoisted(() => {
  process.env.STORAGE_DRIVER = "supabase";
  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_BUCKET = "bethel-uploads";
  process.env.SUPABASE_SERVICE_KEY = "test-service-key";
});

const { fetchMock, poolMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  poolMock: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("../../config/database", () => ({ pool: poolMock }));

import app from "../app";
import { routeSql, signAdminToken } from "../helpers";
import { getStorageDriver } from "../../services/storageService";

/** Smallest valid 1x1 PNG. */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const OBJECT_BASE =
  "https://fake-project.supabase.co/storage/v1/object/bethel-uploads";
const PUBLIC_BASE =
  "https://fake-project.supabase.co/storage/v1/object/public/bethel-uploads";

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);

  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => "",
  });

  poolMock.query.mockReset();
  poolMock.query.mockResolvedValue({ rows: [] });

  // requireAdmin session check.
  routeSql(poolMock, [
    {
      match: /password_changed_at/,
      rows: [{ password_changed_at: null }],
    },
  ]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// Prevent the supabase configuration from leaking into other test
// files that may share this worker process.
afterAll(() => {
  delete process.env.STORAGE_DRIVER;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_BUCKET;
  delete process.env.SUPABASE_SERVICE_KEY;
});

describe("supabase storage driver", () => {
  it("is selected when STORAGE_DRIVER=supabase", () => {
    expect(getStorageDriver().kind).toBe("supabase");
  });

  it("uploads to the bucket and returns the public object url", async () => {
    const response = await request(app)
      .post("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .attach("file", PNG_1X1, {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);

    const { filename, url } = response.body.data as {
      filename: string;
      url: string;
    };

    expect(filename.endsWith(".png")).toBe(true);
    expect(url).toBe(`${PUBLIC_BASE}/${filename}`);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(calledUrl).toBe(`${OBJECT_BASE}/${filename}`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer test-service-key",
      "Content-Type": "image/png",
      "x-upsert": "true",
    });
    expect(init.body).toEqual(new Uint8Array(PNG_1X1));
  });

  it("reports a store failure as a 500 without leaking details", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Invalid API key",
    });

    const response = await request(app)
      .post("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .attach("file", PNG_1X1, {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(500);
  });

  it("deletes objects from the bucket by url", async () => {
    const deleted = await request(app)
      .delete("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({ url: `${PUBLIC_BASE}/1712000000-abc-123.png` });

    expect(deleted.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(calledUrl).toBe(
      `${OBJECT_BASE}/1712000000-abc-123.png`
    );
    expect(init.method).toBe("DELETE");
    expect(init.headers).toEqual({
      Authorization: "Bearer test-service-key",
    });
  });

  it("refuses to delete urls that are not served by this driver", async () => {
    const response = await request(app)
      .delete("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({ url: "https://cdn.example.com/photo.png" });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
