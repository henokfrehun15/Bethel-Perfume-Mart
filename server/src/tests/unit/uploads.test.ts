import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
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
import { routeSql, signAdminToken } from "../helpers";
import {
  filenameFromUrl,
  getUploadDir,
  resolveUploadPath,
  sniffImageMime,
} from "../../services/uploadService";

/** Smallest valid 1x1 PNG. */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

beforeEach(() => {
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

afterAll(async () => {
  await rm(getUploadDir(), { recursive: true, force: true });
});

describe("upload path safety", () => {
  it("resolves a plain filename inside the upload directory", () => {
    const resolved = resolveUploadPath("123-abc.png");

    expect(resolved).not.toBeNull();
    expect(resolved).toBe(
      path.join(getUploadDir(), "123-abc.png")
    );
  });

  it("rejects traversal attempts and nested paths", () => {
    for (const unsafe of [
      "../secret.txt",
      "sub/dir.jpg",
      "..",
      "",
      "weird name.png",
    ]) {
      expect(resolveUploadPath(unsafe)).toBeNull();
    }
  });

  it("extracts the filename only from this server's upload URLs", () => {
    expect(
      filenameFromUrl(
        "http://localhost:5000/uploads/123-abc.png"
      )
    ).toBe("123-abc.png");

    expect(filenameFromUrl("/uploads/123-abc.png")).toBe(
      "123-abc.png"
    );

    expect(
      filenameFromUrl("https://cdn.example.com/photo.png")
    ).toBeNull();

    expect(
      filenameFromUrl(
        "http://localhost:5000/uploads/../../etc/passwd"
      )
    ).toBeNull();
  });
});

describe("image magic bytes", () => {
  it("detects the supported formats", () => {
    expect(sniffImageMime(PNG_1X1)).toBe("image/png");

    expect(
      sniffImageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))
    ).toBe("image/jpeg");

    expect(
      sniffImageMime(
        Buffer.concat([
          Buffer.from("GIF89a", "ascii"),
          Buffer.alloc(6),
        ])
      )
    ).toBe("image/gif");

    expect(
      sniffImageMime(
        Buffer.concat([
          Buffer.from("RIFF", "ascii"),
          Buffer.alloc(4),
          Buffer.from("WEBP", "ascii"),
        ])
      )
    ).toBe("image/webp");
  });

  it("rejects non-image content", () => {
    expect(
      sniffImageMime(Buffer.from("just some text", "utf8"))
    ).toBeNull();
  });
});

describe("POST /api/uploads/images", () => {
  it("requires authentication", async () => {
    const response = await request(app)
      .post("/api/uploads/images")
      .attach("file", PNG_1X1, "photo.png");

    expect(response.status).toBe(401);
  });

  it("rejects non-image uploads", async () => {
    const response = await request(app)
      .post("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .attach("file", Buffer.from("plain text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Unsupported");
  });

  it("rejects a spoofed image extension with the wrong bytes", async () => {
    const response = await request(app)
      .post("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .attach("file", Buffer.from("this is not an image"), {
        filename: "fake.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("not a valid");
  });

  it("stores a real image and serves it back", async () => {
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

    // The client filename is never reused.
    expect(filename).not.toBe("photo.png");
    expect(filename.endsWith(".png")).toBe(true);
    // Upload URLs are stored relative to the API so they survive
    // origin changes between environments.
    expect(url).toBe(`/uploads/${filename}`);
    expect(
      existsSync(path.join(getUploadDir(), filename))
    ).toBe(true);

    const served = await request(app).get(`/uploads/${filename}`);

    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toContain("image/png");
  });

  it("serves images with a cross-origin resource policy", async () => {
    // Regression: helmet's default "same-origin" CORP header made
    // browsers block /uploads images embedded by the storefront
    // (a different origin), even though the request returned 200.
    const uploaded = await request(app)
      .post("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .attach("file", PNG_1X1, {
        filename: "photo.png",
        contentType: "image/png",
      });

    const { filename } = uploaded.body.data as {
      filename: string;
    };

    const served = await request(app).get(`/uploads/${filename}`);

    expect(served.status).toBe(200);
    expect(served.headers["cross-origin-resource-policy"]).toBe(
      "cross-origin"
    );
  });

  it("deletes an uploaded image", async () => {
    const uploaded = await request(app)
      .post("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .attach("file", PNG_1X1, {
        filename: "photo.png",
        contentType: "image/png",
      });

    const { filename, url } = uploaded.body.data as {
      filename: string;
      url: string;
    };

    const deleted = await request(app)
      .delete("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({ url });

    expect(deleted.status).toBe(200);
    expect(
      existsSync(path.join(getUploadDir(), filename))
    ).toBe(false);

    const served = await request(app).get(`/uploads/${filename}`);

    expect(served.status).toBe(404);
  });

  it("refuses to delete external images", async () => {
    const response = await request(app)
      .delete("/api/uploads/images")
      .set("Authorization", `Bearer ${signAdminToken()}`)
      .send({ url: "https://cdn.example.com/photo.png" });

    expect(response.status).toBe(400);
  });
});