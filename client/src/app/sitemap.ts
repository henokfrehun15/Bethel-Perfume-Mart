import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

interface SitemapProduct {
  slug: string;
  updated_at?: string;
}

/**
 * Static routes plus the product catalogue.
 *
 * Product lookups are best-effort: if the API is unavailable (for example
 * during a build in CI) we still emit the static routes instead of failing.
 */
async function loadProductEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const response = await fetch(
      `${API_URL}/products?limit=100`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      data?: SitemapProduct[];
    };

    return (payload.data || [])
      .filter((product) => Boolean(product.slug))
      .map((product) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const productEntries = await loadProductEntries();

  return [...staticEntries, ...productEntries];
}
