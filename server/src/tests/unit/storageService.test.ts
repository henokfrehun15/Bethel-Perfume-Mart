import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
  getStorageDriver,
  missingS3Config,
  type StorageDriver,
} from "../../services/storageService";
import { getUploadDir } from "../../services/uploadService";

let driver: StorageDriver;

afterAll(async () => {
  await rm(getUploadDir(), { recursive: true, force: true });
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
