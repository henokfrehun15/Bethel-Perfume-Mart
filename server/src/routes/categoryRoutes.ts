import { Router } from "express";

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
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
