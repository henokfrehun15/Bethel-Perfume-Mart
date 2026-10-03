import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";

import {
  deleteUploadedImage,
  uploadImage,
} from "../controllers/uploadController";
import { requireAdmin } from "../middleware/authMiddleware";
import { env } from "../config/env";
import { imageUpload } from "../services/uploadService";

const router = Router();

/**
 * Multer reports storage and filter failures through the callback.
 * Translate them into clear 4xx responses instead of letting them
 * bubble up to the generic 500 handler.
 */
const receiveImage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  imageUpload.single("file")(
    req,
    res,
    (error: unknown) => {
      if (!error) {
        return next();
      }

      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        const maxMb = Math.round(
          env.uploadMaxBytes / (1024 * 1024)
        );

        return res.status(413).json({
          success: false,
          message: `That image is too large. Maximum size is ${maxMb} MB.`,
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The image could not be uploaded.",
      });
    }
  );
};

router.post("/images", requireAdmin, receiveImage, uploadImage);
router.delete("/images", requireAdmin, deleteUploadedImage);

export default router;