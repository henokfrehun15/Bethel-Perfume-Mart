import { Router } from "express";
import { requireAdmin } from "../middleware/authMiddleware";
import {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

import { validate } from "../middleware/validate";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/productValidator";

const router = Router();

// Public
router.get("/", getProducts);
router.get("/id/:id", getProductById);
router.get("/:slug", getProductBySlug);

// Admin
router.post(
  "/",
  requireAdmin,
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  requireAdmin,
  validate(updateProductSchema),
  updateProduct
);

router.delete("/:id",
  requireAdmin,
  deleteProduct);

export default router;