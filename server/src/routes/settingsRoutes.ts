import { Router } from "express";

import { requireAdmin } from "../middleware/authMiddleware";

import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController";

const router = Router();

// Public
router.get("/", getSettings);

// Admin
router.put(
  "/",
  requireAdmin,
  updateSettings
);

export default router;