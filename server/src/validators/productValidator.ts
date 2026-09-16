import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().max(255).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(260)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only"
    ),

  description: z.string().trim().optional(),

  price: z.number().nonnegative(),

  currency: z
    .string()
    .length(3)
    .default("ETB"),

  brand: z.string().trim().max(100).optional(),

  size: z.string().trim().max(50).optional(),

  stock_status: z
    .enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"])
    .default("IN_STOCK"),

  stock_qty: z
    .number()
    .int()
    .nonnegative()
    .default(0),

  is_featured: z.boolean().default(false),

  is_promotion: z.boolean().default(false),

  promotion_price: z
    .number()
    .nonnegative()
    .optional(),

  promotion_text: z
    .string()
    .trim()
    .max(255)
    .optional(),

  category_id: z
    .number()
    .int()
    .positive(),

  images: z
    .array(imageSchema)
    .default([]),
});

export const updateProductSchema =
  createProductSchema.partial();