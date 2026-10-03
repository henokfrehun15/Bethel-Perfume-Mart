import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { Request } from "express";
import multer from "multer";

import { env } from "../config/env";

/** Where uploaded images are served from, e.g. /uploads/abc.jpg */
export const UPLOAD_MOUNT_PATH = "/uploads";

/** Rejection raised for files we refuse to store. */
export class UploadRejectedError extends Error {}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

export function isAllowedImageMime(
  mimeType: string
): boolean {
  return Boolean(EXTENSION_BY_MIME[mimeType]);
}

/**
 * Absolute path of the upload directory, created on first use.
 * Relative UPLOAD_DIR values resolve from the server package folder.
 */
export function getUploadDir(): string {
  const dir = path.isAbsolute(env.uploadDir)
    ? env.uploadDir
    : path.resolve(process.cwd(), env.uploadDir);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return dir;
}

/**
 * Absolute URL for a stored file. Uses PUBLIC_ASSET_URL when set,
 * otherwise derives the origin from the incoming request.
 */
export function buildPublicUrl(
  req: Request,
  filename: string
): string {
  const base = env.publicAssetUrl
    ? env.publicAssetUrl.replace(/\/+$/, "")
    : `${req.protocol}://${req.get("host") ?? "localhost"}`;

  return `${base}${UPLOAD_MOUNT_PATH}/${filename}`;
}

/**
 * Resolve a bare filename to an absolute path inside the upload
 * directory, or null when the name is unsafe (traversal attempts,
 * nested paths, unexpected characters).
 */
export function resolveUploadPath(
  filename: string
): string | null {
  // "." and ".." pass the character test, so reject them explicitly.
  if (
    filename === "." ||
    filename === ".." ||
    !/^[A-Za-z0-9._-]+$/.test(filename)
  ) {
    return null;
  }

  const dir = getUploadDir();
  const target = path.resolve(dir, filename);

  // Defence in depth: the file must sit directly in the upload
  // directory, never in a subdirectory or above it.
  if (path.dirname(target) !== dir) {
    return null;
  }

  return target;
}

/**
 * Extract the stored filename from a public upload URL, or null when
 * the URL does not point at this server's upload mount.
 */
export function filenameFromUrl(url: string): string | null {
  let pathname: string;

  try {
    pathname = new URL(url, "http://placeholder.invalid")
      .pathname;
  } catch {
    return null;
  }

  const prefix = `${UPLOAD_MOUNT_PATH}/`;

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const filename = decodeURIComponent(
    pathname.slice(prefix.length)
  );

  return /^[A-Za-z0-9._-]+$/.test(filename) ? filename : null;
}

/**
 * Identify an image by its magic bytes. The browser-reported MIME
 * type can be spoofed, so the stored file is verified after upload.
 */
export function sniffImageMime(
  buffer: Buffer
): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ])
      )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(
      buffer.toString("ascii", 0, 6)
    )
  ) {
    return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis"].includes(
      buffer.toString("ascii", 8, 12)
    )
  ) {
    return "image/avif";
  }

  return null;
}

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      try {
        callback(null, getUploadDir());
      } catch (error) {
        callback(error as Error, "");
      }
    },
    filename: (_req, file, callback) => {
      const extension =
        EXTENSION_BY_MIME[file.mimetype] ?? ".bin";

      // The client filename is never trusted or reused.
      callback(
        null,
        `${Date.now()}-${randomUUID()}${extension}`
      );
    },
  }),
  limits: {
    fileSize: env.uploadMaxBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (isAllowedImageMime(file.mimetype)) {
      return callback(null, true);
    }

    callback(
      new UploadRejectedError(
        `Unsupported image type: ${file.mimetype}. Use JPEG, PNG, WebP, AVIF or GIF.`
      )
    );
  },
});