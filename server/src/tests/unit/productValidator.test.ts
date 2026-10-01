import { describe, expect, it } from "vitest";

import {
  createProductSchema,
  updateProductSchema,
} from "../../validators/productValidator";

const validProduct = {
  name: "Amber Perfume",
  slug: "amber-perfume",
  price: 1800,
  currency: "ETB",
  stock_status: "IN_STOCK",
  stock_qty: 4,
  is_featured: false,
  is_promotion: false,
  category_id: 1,
};

describe("createProductSchema", () => {
  it("accepts a full valid payload", () => {
    const result = createProductSchema.safeParse(validProduct);

    expect(result.success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      slug: "Not A Slug!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      price: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown stock status", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      stock_status: "MAYBE",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a payload without optional fields", () => {
    const result = createProductSchema.safeParse({
      name: "Rose Perfume",
      slug: "rose-perfume",
      price: 1500,
      category_id: 1,
    });

    expect(result.success).toBe(true);
  });
});

/*
 * Regression tests for a real bug: Zod applies `.default()` values
 * even inside `.partial()`, and the validate middleware replaces
 * req.body with the parsed result — so a partial update like
 * `{ is_active: false }` used to silently reset stock levels,
 * flags and images to their defaults.
 */
describe("updateProductSchema (partial updates)", () => {
  it("does not inject defaults for missing fields", () => {
    const parsed = updateProductSchema.parse({
      is_active: false,
    });

    expect(parsed).toEqual({ is_active: false });

    expect(parsed).not.toHaveProperty("stock_qty");
    expect(parsed).not.toHaveProperty("stock_status");
    expect(parsed).not.toHaveProperty("currency");
    expect(parsed).not.toHaveProperty("is_featured");
    expect(parsed).not.toHaveProperty("is_promotion");
    expect(parsed).not.toHaveProperty("images");
  });

  it("keeps the payload minimal for a single-field update", () => {
    const parsed = updateProductSchema.parse({
      name: "Renamed product",
    });

    expect(parsed).toEqual({ name: "Renamed product" });
  });

  it("still validates values that are provided", () => {
    expect(
      updateProductSchema.safeParse({ stock_qty: -5 }).success
    ).toBe(false);

    expect(
      updateProductSchema.safeParse({ stock_status: "MAYBE" })
        .success
    ).toBe(false);

    expect(
      updateProductSchema.safeParse({ price: -1 }).success
    ).toBe(false);

    expect(
      updateProductSchema.safeParse({ is_active: "yes" }).success
    ).toBe(false);
  });
});
