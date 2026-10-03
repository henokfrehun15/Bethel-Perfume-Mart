import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetail from "@/components/storefront/ProductDetail";
import { resolveImageUrl } from "@/lib/images";
import {
  getProductBySlug,
  type Product,
} from "@/lib/serverApi";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/*
 * Product pages render on the server so search engines and social
 * cards see real content instead of an empty shell.
 *
 * The route is rendered per request: with ISR, `notFound()` cannot
 * change the response status, so unknown products would be served as
 * a 200 soft-404. The API call itself is still cached for
 * PRODUCT_REVALIDATE_SECONDS in src/lib/serverApi.ts.
 *
 * NOTE: do not add a sibling `loading.tsx` here. In Next.js that
 * wraps the segment in HTTPAccessFallbackBoundary, which swallows
 * the 404 status of `notFound()` and serves unknown products with
 * HTTP 200 (vercel/next.js#93253).
 */
export const dynamic = "force-dynamic";

function truncate(value: string, max = 160): string {
  return value.length > max
    ? `${value.slice(0, max - 1).trimEnd()}…`
    : value;
}

function buildDescription(product: Product): string {
  if (product.description?.trim()) {
    return truncate(product.description.trim());
  }

  const brand = product.brand
    ? ` by ${product.brand}`
    : "";

  return `Buy ${product.name}${brand} from ${SITE_NAME}. Order online with fast delivery across Ethiopia.`;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/products/${product.slug}`;
  const description = buildDescription(product);

  // The root layout appends "| Bethel Perfume" to <title>, so the page
  // title itself must not repeat the site name.
  const pageTitle = product.brand
    ? `${product.name} by ${product.brand}`
    : product.name;

  const socialTitle = `${pageTitle} | ${SITE_NAME}`;

  const image = product.images[0];
  // Uploads are stored as /uploads/... paths served by the API, so
  // they must resolve against the API origin, not the site origin.
  const imageUrl = resolveImageUrl(image?.url) ?? undefined;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: imageUrl
        ? [{ url: imageUrl, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: imageUrl,
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}