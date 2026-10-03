import type { Metadata } from "next";
import Link from "next/link";

import BotanicalBackground from "@/components/BotanicalBackground";
import ProductCard from "@/components/storefront/ProductCard";
import ProductFilters from "@/components/storefront/ProductFilters";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import {
  getStorefrontCategories,
  getStorefrontProducts,
} from "@/lib/serverApi";

const LIMIT = 12;

interface ProductsPageProps {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}

function single(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

interface CatalogueQuery {
  search: string;
  category: string;
  inStock: boolean;
  promotion: boolean;
  page: number;
}

function readQuery(
  params: Record<string, string | string[] | undefined>
): CatalogueQuery {
  const search = single(params.search)?.trim() ?? "";
  const category = single(params.category) ?? "";
  const inStock = single(params.inStock) === "true";
  const promotion = single(params.promotion) === "true";
  const page = Math.max(
    1,
    Number(single(params.page)) || 1
  );

  return { search, category, inStock, promotion, page };
}

/** API query string for the current filters and page. */
function apiQuery(query: CatalogueQuery): string {
  const params = new URLSearchParams();

  params.set("limit", String(LIMIT));
  params.set("offset", String((query.page - 1) * LIMIT));

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.category) {
    params.set("category", query.category);
  }

  if (query.inStock) {
    params.set("inStock", "true");
  }

  if (query.promotion) {
    params.set("promotion", "true");
  }

  return params.toString();
}

/** Browser URL for the same filters on another page. */
function pageHref(
  query: CatalogueQuery,
  page: number
): string {
  const params = new URLSearchParams();

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.category) {
    params.set("category", query.category);
  }

  if (query.inStock) {
    params.set("inStock", "true");
  }

  if (query.promotion) {
    params.set("promotion", "true");
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const suffix = params.toString();

  return suffix ? `/products?${suffix}` : "/products";
}

/*
 * Filtered views are rendered per request from the search params, so
 * search engines index the clean /products URL while filter
 * combinations stay shareable and back-button friendly.
 */
export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = readQuery(params);

  const filtered =
    Boolean(
      query.search ||
        query.category ||
        query.inStock ||
        query.promotion
    ) || query.page > 1;

  return {
    title: "Collection",
    description:
      "Explore the Bethel Perfume collection and discover fragrances for every moment.",
    alternates: { canonical: "/products" },
    ...(filtered
      ? {
          // Filter combinations and pages beyond the first add no
          // unique value to the index.
          robots: { index: false, follow: true },
        }
      : {}),
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const query = readQuery(params);

  const [productsResult, categories] = await Promise.all([
    getStorefrontProducts(apiQuery(query)),
    getStorefrontCategories({ revalidate: 300 }),
  ]);

  const products = productsResult?.data ?? [];
  const total = productsResult?.total ?? 0;
  const failed = productsResult === null;

  const totalPages = Math.max(
    1,
    Math.ceil(total / LIMIT)
  );

  return (
    <main className="bethel-page min-h-screen">
      {/* Botanical background */}
      <BotanicalBackground />

      <div className="relative z-10">
        {/* Shared storefront header with live cart count */}
        <StorefrontHeader />

        <section className="bethel-container py-12 md:py-16">
          {/* Page introduction */}
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
              The collection
            </p>

            <h1 className="font-serif text-4xl leading-tight text-[#30272a] md:text-5xl">
              Find a fragrance that feels like you.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-[#756b6e]">
              Explore the Bethel Perfume collection and
              discover fragrances for every moment.
            </p>
          </div>

          {/* Filters */}
          <ProductFilters
            categories={categories ?? []}
            search={query.search}
            category={query.category}
            inStock={query.inStock}
            promotion={query.promotion}
          />

          {/* Results summary */}
          <div className="mt-10 flex items-center justify-between gap-4">
            <p className="text-sm text-[#756b6e]">
              {failed
                ? "Could not load fragrances."
                : `${total} fragrance${
                    total === 1 ? "" : "s"
                  } found`}
            </p>

            {total > 0 && (
              <p className="text-sm text-[#756b6e]">
                Page {query.page} of {totalPages}
              </p>
            )}
          </div>

          {/* Error */}
          {failed && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              The collection could not be loaded. Please
              refresh the page and try again.
            </div>
          )}

          {/* Product content */}
          {!failed && products.length > 0 ? (
            <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : null}

          {!failed &&
            products.length === 0 && (
              <div className="mt-8 rounded-3xl border border-dashed border-[#d9c4ca] bg-white/70 px-6 py-16 text-center">
                <p className="font-serif text-2xl text-[#30272a]">
                  No fragrances found
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756b6e]">
                  Try a different search or remove some
                  filters to see more of the collection.
                </p>

                <Link
                  href="/products"
                  className="mt-6 inline-flex rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
                >
                  View all fragrances
                </Link>
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              {query.page > 1 ? (
                <Link
                  href={pageHref(query, query.page - 1)}
                  className="rounded-2xl border border-[#dfd3d7] bg-white px-5 py-3 text-sm font-medium text-[#756b6e] transition hover:border-[#c96a82] hover:text-[#9e405a]"
                >
                  Previous
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-2xl border border-[#dfd3d7] bg-white px-5 py-3 text-sm font-medium text-[#756b6e] opacity-40"
                >
                  Previous
                </span>
              )}

              <span className="rounded-2xl bg-[#f7e5e9] px-5 py-3 text-sm font-semibold text-[#9e405a]">
                {query.page}
              </span>

              {query.page < totalPages ? (
                <Link
                  href={pageHref(query, query.page + 1)}
                  className="rounded-2xl border border-[#dfd3d7] bg-white px-5 py-3 text-sm font-medium text-[#756b6e] transition hover:border-[#c96a82] hover:text-[#9e405a]"
                >
                  Next
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-2xl border border-[#dfd3d7] bg-white px-5 py-3 text-sm font-medium text-[#756b6e] opacity-40"
                >
                  Next
                </span>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
