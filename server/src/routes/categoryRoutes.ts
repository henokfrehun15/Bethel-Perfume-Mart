import { Router } from "express";
import { requireAdmin } from "../middleware/authMiddleware";
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
router.post("/", 
    requireAdmin, 
    createCategory
);
router.put("/:id",
    requireAdmin,
    updateCategory
);

router.delete("/:id", 
    requireAdmin,
    deleteCategory
);

export default router;
