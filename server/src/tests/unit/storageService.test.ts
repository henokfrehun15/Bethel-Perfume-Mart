import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

/**
 * Test files run concurrently and each cleans its upload directory
 * in afterAll, so this file uses its own directory to avoid deleting
 * files another test file is still writing.
 */
vi.hoisted(() => {
  process.env.UPLOAD_DIR = ".tmp-test-storage";
});

import {
  getStorageDriver,
  missingS3Config,
  missingSupabaseConfig,
  type StorageDriver,
} from "../../services/storageService";
import { getUploadDir } from "../../services/uploadService";

let driver: StorageDriver;

afterAll(async () => {
  await rm(getUploadDir(), { recursive: true, force: true });

  // Do not leak the override into other test files sharing this worker.
  delete process.env.UPLOAD_DIR;
});

describe("storage driver selection", () => {
  it("uses the local disk driver by default", () => {
    driver = getStorageDriver();

    expect(driver.kind).toBe("local");
  });

  it("lists the missing variables required for the s3 driver", () => {
    expect(missingS3Config()).toEqual([
      "S3_BUCKET",
      "S3_REGION",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ]);
  });

  it("lists the missing variables required for the supabase driver", () => {
    expect(missingSupabaseConfig()).toEqual([
      "SUPABASE_URL",
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_BUCKET",
    ]);
  });
});

describe("local storage driver", () => {
  it("stores bytes and exposes a relative public url", async () => {
    driver = getStorageDriver();

    const stored = await driver.storeImage(
      "unit-test-image.png",
      Buffer.from("fake-png-bytes"),
      "image/png"
    );

    expect(stored).toBe(true);
    expect(
      existsSync(
        path.join(getUploadDir(), "unit-test-image.png")
      )
    ).toBe(true);
    expect(driver.publicUrl("unit-test-image.png")).toBe(
      "/uploads/unit-test-image.png"
    );
  });

  it("extracts filenames only from its own public urls", () => {
    expect(
      driver.filenameFromPublicUrl(
        "/uploads/123-abc.png"
      )
    ).toBe("123-abc.png");

    expect(
      driver.filenameFromPublicUrl(
        "http://localhost:5000/uploads/123-abc.png"
      )
    ).toBe("123-abc.png");

    expect(
      driver.filenameFromPublicUrl(
        "https://cdn.example.com/photo.png"
      )
    ).toBeNull();

    expect(
      driver.filenameFromPublicUrl(
        "/uploads/../../etc/passwd"
      )
    ).toBeNull();
  });

  it("deletes stored files and treats missing files as deleted", async () => {
    const deleted = await driver.deleteImage(
      "unit-test-image.png"
    );

    expect(deleted).toBe(true);
    expect(
      existsSync(
        path.join(getUploadDir(), "unit-test-image.png")
      )
    ).toBe(false);

    // Already gone is still the desired end state.
    expect(
      await driver.deleteImage("unit-test-image.png")
    ).toBe(true);
  });

  it("refuses unsafe filenames", async () => {
    expect(
      await driver.storeImage(
        "../escape.png",
        Buffer.alloc(0),
        "image/png"
      )
    ).toBe(false);

    expect(await driver.deleteImage("sub/dir.png")).toBe(
      false
    );
  });
});
