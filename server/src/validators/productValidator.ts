import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().max(255).optional(),
});

const numberFromInput = z.coerce.number();

const integerFromInput =
  z.coerce.number().int();

/*
 * NOTE: No field may carry a `.default()` here.
 *
 * `validate` replaces req.body with the parsed result, and Zod applies
 * defaults even inside `.partial()` — so a partial update like
 * `{ is_active: false }` would silently rewrite every defaulted field
 * (wiping stock levels and images). The controller applies its own
 * defaults on create, so the schema only validates.
 */
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
    .optional(),

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
    .optional(),

  stock_qty: integerFromInput
    .nonnegative()
    .optional(),

  is_featured: z.coerce.boolean().optional(),

  is_promotion: z
    .coerce
    .boolean()
    .optional(),

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

  is_active: z.boolean().optional(),

  category_id: integerFromInput.positive(),

  images: z
    .array(imageSchema)
    .optional(),
});

export const updateProductSchema =
  createProductSchema.partial();