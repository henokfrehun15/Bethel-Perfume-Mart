/**
 * Server-side API access for server components.
 *
 * The client-side helper in `api.ts` reads the admin token from
 * localStorage, so it cannot run on the server. This module fetches
 * public storefront data during render, which is what makes product
 * pages crawlable and link-previewable.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/** Product pages are re-rendered at most every 5 minutes. */
export const PRODUCT_REVALIDATE_SECONDS = 300;

export interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  currency: string;
  brand: string | null;
  size: string | null;
  stock_status:
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK";
  stock_qty: number;
  is_featured: boolean;
  is_promotion: boolean;
  promotion_price: string | number | null;
  promotion_text: string | null;
  category_id: number;
  category_name?: string | null;
  images: ProductImage[];
}

/**
 * Fetch a product for rendering. Returns null when the product does
 * not exist (or is hidden), so the caller can render a 404. Other
 * failures propagate to the nearest error boundary.
 */
export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const response = await fetch(
    `${API_URL}/products/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: PRODUCT_REVALIDATE_SECONDS },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load product "${slug}" (${response.status})`
    );
  }

  const payload = (await response.json()) as {
    data?: Product;
  };

  return payload.data ?? null;
}