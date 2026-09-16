import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().max(255).optional(),
});

const numberFromInput = z.coerce.number();

const integerFromInput =
  z.coerce.number().int();

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(255),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(260)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only"
    ),

  description: z
    .string()
    .trim()
    .optional()
    .nullable(),

  price: numberFromInput.nonnegative(),

  currency: z
    .string()
    .length(3)
    .default("ETB"),

  brand: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable(),

  size: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  stock_status: z
    .enum([
      "IN_STOCK",
      "LOW_STOCK",
      "OUT_OF_STOCK",
    ])
    .default("IN_STOCK"),

  stock_qty: integerFromInput
    .nonnegative()
    .default(0),

  is_featured: z.coerce.boolean().default(false),

  is_promotion: z
    .coerce
    .boolean()
    .default(false),

  promotion_price: numberFromInput
    .nonnegative()
    .optional()
    .nullable(),

  promotion_text: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),

  category_id: integerFromInput.positive(),

  images: z
    .array(imageSchema)
    .default([]),
});

export const updateProductSchema =
  createProductSchema.partial();