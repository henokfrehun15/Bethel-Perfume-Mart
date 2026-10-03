import { open, unlink } from "node:fs/promises";
import { Request, Response } from "express";

import {
  buildPublicUrl,
  filenameFromUrl,
  resolveUploadPath,
  sniffImageMime,
} from "../services/uploadService";

/** Read the first bytes of a stored file for magic-byte checks. */
async function readHead(
  absolutePath: string
): Promise<Buffer> {
  const handle = await open(absolutePath, "r");

  try {
    const buffer = Buffer.alloc(16);

    const { bytesRead } = await handle.read(
      buffer,
      0,
      buffer.length,
      0
    );

    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function removeQuietly(
  absolutePath: string
): Promise<void> {
  try {
    await unlink(absolutePath);
  } catch {
    // The file may already be gone; nothing to clean up.
  }
}

// POST /api/uploads/images (admin)
export const uploadImage = async (
  req: Request,
  res: Response
) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message:
        "No image was uploaded. Send the file as multipart field 'file'.",
    });
  }

  const absolute = resolveUploadPath(file.filename);

  if (!absolute) {
    return res.status(400).json({
      success: false,
      message: "The uploaded file could not be stored.",
    });
  }

  // The browser-reported MIME type is untrusted, so verify the bytes.
  let detected: string | null = null;

  try {
    detected = sniffImageMime(await readHead(absolute));
  } catch {
    await removeQuietly(absolute);

    return res.status(400).json({
      success: false,
      message: "The uploaded file could not be read.",
    });
  }

  if (!detected) {
    await removeQuietly(absolute);

    return res.status(400).json({
      success: false,
      message:
        "That file is not a valid JPEG, PNG, WebP, AVIF or GIF image.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Image uploaded.",
    data: {
      filename: file.filename,
      url: buildPublicUrl(file.filename),
      size: file.size,
      mime: detected,
    },
  });
};

// DELETE /api/uploads/images (admin)
// Removes a previously uploaded file. External URLs are rejected:
// those files are not ours to delete.
export const deleteUploadedImage = async (
  req: Request,
  res: Response
) => {
  const url =
    typeof req.body?.url === "string" ? req.body.url : "";

  const filename = url ? filenameFromUrl(url) : null;
  const absolute = filename
    ? resolveUploadPath(filename)
    : null;

  if (!filename || !absolute) {
    return res.status(400).json({
      success: false,
      message:
        "Only images uploaded to this server can be deleted.",
    });
  }

  try {
    await unlink(absolute);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    // Already gone is still the desired end state.
    if (code !== "ENOENT") {
      console.error("Delete upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete the image",
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Image deleted.",
  });
};