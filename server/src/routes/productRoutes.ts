import { Router } from "express";

import {
  getProducts,
  getProductBySlug,
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
router.get("/:slug", getProductBySlug);

// Admin
router.post(
  "/",
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  validate(updateProductSchema),
  updateProduct
);

router.delete("/:id", deleteProduct);

export default router;