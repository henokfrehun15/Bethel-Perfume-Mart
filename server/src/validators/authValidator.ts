import { z } from "zod";

/*
 * bcrypt only uses the first 72 bytes of a password, so longer values
 * are rejected outright rather than silently truncated.
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),

  newPassword: z
    .string()
    .min(8, "The new password must be at least 8 characters")
    .max(72, "The new password must be at most 72 characters"),
});