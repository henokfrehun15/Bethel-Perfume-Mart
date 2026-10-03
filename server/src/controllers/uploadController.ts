import { Request, Response } from "express";

import {
  generateImageFilename,
  sniffImageMime,
} from "../services/uploadService";
import { getStorageDriver } from "../services/storageService";

// POST /api/uploads/images (admin)
export const uploadImage = async (
  req: Request,
  res: Response
) => {
  const file = req.file;

  if (!file || !file.buffer) {
    return res.status(400).json({
      success: false,
      message:
        "No image was uploaded. Send the file as multipart field 'file'.",
    });
  }

  // The browser-reported MIME type is untrusted; the bytes decide.
  const detected = sniffImageMime(file.buffer);

  if (!detected) {
    return res.status(400).json({
      success: false,
      message:
        "That file is not a valid JPEG, PNG, WebP, AVIF or GIF image.",
    });
  }

  const filename = generateImageFilename(detected);
  const driver = getStorageDriver();

  const stored = await driver.storeImage(
    filename,
    file.buffer,
    detected
  );

  if (!stored) {
    return res.status(500).json({
      success: false,
      message:
        "The uploaded file could not be stored. Please try again.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Image uploaded.",
    data: {
      filename,
      url: driver.publicUrl(filename),
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

  const driver = getStorageDriver();
  const filename = url
    ? driver.filenameFromPublicUrl(url)
    : null;

  if (!filename) {
    return res.status(400).json({
      success: false,
      message:
        "Only images uploaded to this server can be deleted.",
    });
  }

  const deleted = await driver.deleteImage(filename);

  if (!deleted) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete the image",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Image deleted.",
  });
};
