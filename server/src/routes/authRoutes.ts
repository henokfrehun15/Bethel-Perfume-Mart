import { Router } from "express";
import {
  changePassword,
  login,
  logout,
} from "../controllers/authController";
import { requireAdmin } from "../middleware/authMiddleware";
import { rateLimit } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { changePasswordSchema } from "../validators/authValidator";

const router = Router();

// Brute-force protection: 10 attempts per IP per 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    "Too many login attempts. Please wait a few minutes and try again.",
});

router.post("/login", loginLimiter, login);
router.post("/logout", logout);

// Password changes are rare; keep a generous ceiling so a mistake
// cannot lock the owner out of their own store.
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    "Too many password changes. Please try again in a few minutes.",
});

router.put(
  "/password",
  passwordChangeLimiter,
  requireAdmin,
  validate(changePasswordSchema),
  changePassword
);

export default router;
