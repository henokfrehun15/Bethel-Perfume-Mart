import { Router } from "express";
import { login } from "../controllers/authController";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

// Brute-force protection: 10 attempts per IP per 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message:
    "Too many login attempts. Please wait a few minutes and try again.",
});

router.post("/login", loginLimiter, login);

export default router;
