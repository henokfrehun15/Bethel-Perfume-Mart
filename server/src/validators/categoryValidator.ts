import { z } from "zod";

/*
 * NOTE: No field may carry a `.default()` here.
 *
 * `validate` replaces req.body with the parsed result, and Zod applies
 * defaults even inside `.partial()` (see productValidator.ts for the
 * details). The controller applies its own behaviour for missing
 * fields, so the schema only validates.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only"
    ),

  description: z
    .string()
    .trim()
    .optional()
    .nullable(),

  parent_id: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

export const updateCategorySchema =
  createCategorySchema.partial();
