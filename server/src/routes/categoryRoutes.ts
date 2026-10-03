import { Router } from "express";
import { requireAdmin } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/categoryValidator";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";

const router = Router();

// Public routes
router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

// Admin routes
router.post(
  "/",
  requireAdmin,
  validate(createCategorySchema),
  createCategory
);
router.put(
  "/:id",
  requireAdmin,
  validate(updateCategorySchema),
  updateCategory
);

router.delete(
  "/:id",
  requireAdmin,
  deleteCategory
);

export default router;
