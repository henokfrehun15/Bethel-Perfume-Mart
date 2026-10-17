import type { Metadata } from "next";
import Link from "next/link";

import ProductCard from "@/components/storefront/ProductCard";
import ProductFilters from "@/components/storefront/ProductFilters";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
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
    <main>
      {/* Shared storefront header with live cart count */}
      <StorefrontHeader />

      <section className="page">
        {/* Page introduction */}
        <div className="shop-title">
          <span className="eyebrow">Our collection</span>
          <h1>Find your fragrance</h1>
          <p>
            From soft florals to warm, lingering notes—something
            here is waiting to feel like you.
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
        <div className="result-meta">
          <span>
            {failed
              ? "Could not load fragrances."
              : `${total} fragrance${total === 1 ? "" : "s"} found`}
          </span>

          {total > 0 && (
            <span>
              Page {query.page} of {totalPages}
            </span>
          )}
        </div>

        {/* Error */}
        {failed && (
          <div className="bethel-alert bethel-alert-error">
            The collection could not be loaded. Please refresh the
            page and try again.
          </div>
        )}

        {/* Product content */}
        {!failed && products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}

        {!failed && products.length === 0 && (
          <div className="state-page" style={{ minHeight: "auto", padding: "60px 20px" }}>
            <div className="state-icon">✿</div>
            <h1 style={{ fontSize: "2.4rem" }}>No fragrances found</h1>
            <p>
              Try a different search or remove some filters to see
              more of the collection.
            </p>
            <Link href="/products" className="btn btn-primary">
              View all fragrances
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {query.page > 1 ? (
              <Link
                href={pageHref(query, query.page - 1)}
                aria-label="Previous page"
              >
                ←
              </Link>
            ) : (
              <span aria-disabled="true" style={{ opacity: 0.4 }}>
                ←
              </span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <Link
                  key={page}
                  href={pageHref(query, page)}
                  className={page === query.page ? "active" : ""}
                >
                  {page}
                </Link>
              )
            )}

            {query.page < totalPages ? (
              <Link
                href={pageHref(query, query.page + 1)}
                aria-label="Next page"
              >
                →
              </Link>
            ) : (
              <span aria-disabled="true" style={{ opacity: 0.4 }}>
                →
              </span>
            )}
          </div>
        )}
      </section>

      <StorefrontFooter />
    </main>
  );
}
