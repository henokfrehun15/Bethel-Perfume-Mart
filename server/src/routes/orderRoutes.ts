import { Router } from "express";
import {
  createOrder,
  getOrderStats,
  listOrders,
  getOrderByNumber,
  trackOrder,
  updateOrderStatus,
} from "../controllers/orderController";

import { requireAdmin } from "../middleware/authMiddleware";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

// Abuse protection for the public order endpoints: checkout spam and
// phone-number probing via the tracking lookup.
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message:
    "Too many orders from this connection. Please wait a few minutes and try again.",
});

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    "Too many lookup attempts. Please wait a few minutes and try again.",
});

// Public customer checkout + order tracking
router.post("/", checkoutLimiter, createOrder);
router.post("/track", trackLimiter, trackOrder);

// Admin order management
// NOTE: /stats must be registered before /:orderNumber, otherwise Express
// matches "stats" as an order number.
router.get("/stats", requireAdmin, getOrderStats);
router.get("/", requireAdmin, listOrders);
router.get("/:orderNumber", requireAdmin, getOrderByNumber);
router.put("/:orderNumber/status", requireAdmin, updateOrderStatus);

export default router;
