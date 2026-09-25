import { Router } from "express";
import {
  createOrder,
  listOrders,
  getOrderByNumber,
  trackOrder,
  updateOrderStatus,
} from "../controllers/orderController";

import { requireAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public customer checkout + order tracking
router.post("/", createOrder);
router.post("/track", trackOrder);

// Admin order management
router.get("/", requireAdmin, listOrders);
router.get("/:orderNumber", requireAdmin, getOrderByNumber);
router.put("/:orderNumber/status", requireAdmin, updateOrderStatus);

export default router;
