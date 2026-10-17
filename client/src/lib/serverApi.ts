/**
 * Server-side API access for server components.
 *
 * The client-side helper in `api.ts` is browser-oriented (localStorage
 * display hints, cookie credentials), so this module fetches public
 * storefront data during render instead, which is what makes product
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

/** Product row as returned by the list endpoint (cover image only). */
export interface StorefrontProductSummary {
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
  category_name: string | null;
  category_slug: string | null;
  image: string | null;
}

export interface StorefrontCategory {
  id: number;
  name: string;
  slug: string;
}

/** Public store settings (contact details, WhatsApp number). */
export interface StorefrontSettings {
  store_name: string;
  whatsapp_number: string;
  description: string;
  contact_email: string;
  contact_address: string;
  delivery_fee: string;
}

interface FetchOptions {
  /**
   * Cache the response for this many seconds. Omit to always fetch
   * fresh (used for query-driven pages where every combination would
   * create its own cache entry).
   */
  revalidate?: number;
}

function fetchOptions(options: FetchOptions): RequestInit {
  return options.revalidate !== undefined
    ? { next: { revalidate: options.revalidate } }
    : { cache: "no-store" };
}

/**
 * Fetch the product list. Returns null when the request fails, so
 * callers can decide between an empty state and an error notice.
 */
export async function getStorefrontProducts(
  query: string,
  options: FetchOptions = {}
): Promise<{
  data: StorefrontProductSummary[];
  total: number;
} | null> {
  try {
    const suffix = query ? `?${query}` : "";

    const response = await fetch(
      `${API_URL}/products${suffix}`,
      fetchOptions(options)
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: StorefrontProductSummary[];
      total?: number;
    };

    return {
      data: payload.data ?? [],
      total: payload.total ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the category list. Returns null when the request fails;
 * categories only power an optional filter, so callers may treat
 * that as an empty list.
 */
export async function getStorefrontCategories(
  options: FetchOptions = {}
): Promise<StorefrontCategory[] | null> {
  try {
    const response = await fetch(
      `${API_URL}/categories`,
      fetchOptions(options)
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: StorefrontCategory[];
    };

    return payload.data ?? [];
  } catch {
    return null;
  }
}

/**
 * Fetch the public store settings. Returns null when the request
 * fails; callers fall back to sensible defaults.
 */
export async function getStorefrontSettings(
  options: FetchOptions = {}
): Promise<StorefrontSettings | null> {
  try {
    const response = await fetch(
      `${API_URL}/settings`,
      fetchOptions(options)
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: StorefrontSettings;
    };

    return payload.data ?? null;
  } catch {
    return null;
  }
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