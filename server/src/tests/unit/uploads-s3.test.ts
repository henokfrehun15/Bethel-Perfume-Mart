import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

/**
 * The s3 driver must be active before any module reads env, so the
 * variables are set in a hoisted block (dotenv never overrides
 * values that are already present).
 */
vi.hoisted(() => {
  process.env.STORAGE_DRIVER = "s3";
  process.env.S3_BUCKET = "bethel-uploads";
  process.env.S3_REGION = "eu-central-1";
  process.env.S3_ACCESS_KEY_ID = "test-key-id";
  process.env.S3_SECRET_ACCESS_KEY = "test-secret";
  delete process.env.S3_ENDPOINT;
  delete process.env.S3_PUBLIC_URL;
});

const { sendMock, commands } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  commands: [] as { constructor: string; input: unknown }[],
}));

vi.mock("@aws-sdk/client-s3", () => {
  class S3ClientMock {
    send = sendMock;
  }

  class PutObjectCommandMock {
    constructor(public input: unknown) {
      commands.push({
        constructor: "PutObjectCommand",
        input,
      });
    }
  }

  class DeleteObjectCommandMock {
    constructor(public input: unknown) {
      commands.push({
        constructor: "DeleteObjectCommand",
        input,
      });
    }
  }

  return {
    S3Client: S3ClientMock,
    PutObjectCommand: PutObjectCommandMock,
    DeleteObjectCommand: DeleteObjectCommandMock,
  };
});

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
import { getStorageDriver } from "../../services/storageService";

/** Smallest valid 1x1 PNG. */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const S3_BASE =
  "https://bethel-uploads.s3.eu-central-1.amazonaws.com";

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({});
  commands.length = 0;

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
  vi.clearAllMocks();
});

// Prevent the s3 configuration from leaking into other test files
// that may share this worker process.
afterAll(() => {
  delete process.env.STORAGE_DRIVER;
  delete process.env.S3_BUCKET;
  delete process.env.S3_REGION;
  delete process.env.S3_ACCESS_KEY_ID;
  delete process.env.S3_SECRET_ACCESS_KEY;
});

describe("s3 storage driver", () => {
  it("is selected when STORAGE_DRIVER=s3", () => {
    expect(getStorageDriver().kind).toBe("s3");
  });

  it("uploads to the bucket and returns an absolute object url", async () => {
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
    expect(url).toBe(`${S3_BASE}/${filename}`);

    const put = commands.find(
      (command) =>
        command.constructor === "PutObjectCommand"
    );

    expect(put).toBeDefined();
    expect(put!.input).toEqual({
      Bucket: "bethel-uploads",
      Key: filename,
      Body: PNG_1X1,
      ContentType: "image/png",
    });
  });

  it("deletes objects from the bucket by url", async () => {
    const deleted = await request(app)
      .delete("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({ url: `${S3_BASE}/1712000000-abc-123.png` });

    expect(deleted.status).toBe(200);

    const del = commands.find(
      (command) =>
        command.constructor === "DeleteObjectCommand"
    );

    expect(del).toBeDefined();
    expect(del!.input).toEqual({
      Bucket: "bethel-uploads",
      Key: "1712000000-abc-123.png",
    });
  });

  it("refuses to delete urls that are not served by this driver", async () => {
    const response = await request(app)
      .delete("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({ url: "https://cdn.example.com/photo.png" });

    expect(response.status).toBe(400);
    expect(commands).toHaveLength(0);
  });
});
