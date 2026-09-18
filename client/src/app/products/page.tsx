"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import ProductCard, {
  StorefrontProduct,
} from "@/components/storefront/ProductCard";
import { apiRequest } from "@/lib/api";

interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  limit: number;
  offset: number;
  data: StorefrontProduct[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  data: Category[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<
    StorefrontProduct[]
  >([]);

  const [categories, setCategories] = useState<Category[]>(
    []
  );

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState(false);
  const [promotion, setPromotion] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const limit = 12;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response =
          await apiRequest<CategoriesResponse>(
            "/categories"
          );

        setCategories(response.data || []);
      } catch {
        // Categories are only a filter, so don't block
        // the catalog if this request fails.
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        params.set("limit", String(limit));
        params.set(
          "offset",
          String((page - 1) * limit)
        );

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (category) {
          params.set("category", category);
        }

        if (inStock) {
          params.set("inStock", "true");
        }

        if (promotion) {
          params.set("promotion", "true");
        }

        const response =
          await apiRequest<ProductsResponse>(
            `/products?${params.toString()}`
          );

        setProducts(response.data || []);
        setTotal(response.total || 0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    search,
    category,
    inStock,
    promotion,
    page,
  ]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setInStock(false);
    setPromotion(false);
    setPage(1);
  };

  const hasFilters =
    search ||
    category ||
    inStock ||
    promotion;

  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <header className="border-b border-[#eadfe2] bg-white/80 backdrop-blur-md">
          <div className="bethel-container flex min-h-20 items-center justify-between gap-6">
            <Link
              href="/"
              className="font-serif text-2xl text-[#9e405a]"
            >
              Bethel Perfume
            </Link>

            <Link
              href="/"
              className="text-sm font-medium text-[#756b6e] transition hover:text-[#9e405a]"
            >
              Home
            </Link>
          </div>
        </header>

        <section className="bethel-container py-12 md:py-16">
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

          <div className="mt-10 rounded-3xl border border-[#eadfe2] bg-white/90 p-4 shadow-[0_12px_40px_rgba(120,70,85,0.06)] md:p-5">
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-3 md:flex-row"
            >
              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search fragrances..."
                className="min-h-12 flex-1 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a] outline-none transition placeholder:text-[#9b9093] focus:border-[#c96a82] focus:ring-2 focus:ring-[#c96a82]/10"
              />

              <button
                type="submit"
                className="min-h-12 rounded-2xl bg-[#c96a82] px-7 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
              >
                Search
              </button>
            </form>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                className="min-h-11 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a] outline-none focus:border-[#c96a82]"
              >
                <option value="">
                  All categories
                </option>

                {categories.map((item) => (
                  <option
                    key={item.id}
                    value={item.slug}
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a]">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(event) => {
                    setInStock(event.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 accent-[#c96a82]"
                />
                In stock only
              </label>

              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a]">
                <input
                  type="checkbox"
                  checked={promotion}
                  onChange={(event) => {
                    setPromotion(event.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 accent-[#c96a82]"
                />
                Promotions
              </label>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-11 rounded-2xl border border-[#d9c4ca] px-4 text-sm font-medium text-[#9e405a] transition hover:bg-[#f7e5e9]"
                >
                  Clear filters
                </button>
              ) : (
                <div className="hidden lg:block" />
              )}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            <p className="text-sm text-[#756b6e]">
              {loading
                ? "Loading fragrances..."
                : `${total} fragrance${total === 1 ? "" : "s"} found`}
            </p>

            {total > 0 && (
              <p className="text-sm text-[#756b6e]">
                Page {page} of {totalPages}
              </p>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-3xl border border-[#eadfe2] bg-white"
                  >
                    <div className="aspect-[4/5] animate-pulse bg-[#f7e5e9]" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-20 animate-pulse rounded bg-[#f7e5e9]" />
                      <div className="h-6 w-3/4 animate-pulse rounded bg-[#f7e5e9]" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-[#f7e5e9]" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-[#d9c4ca] bg-white/70 px-6 py-16 text-center">
              <p className="font-serif text-2xl text-[#30272a]">
                No fragrances found
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756b6e]">
                Try a different search or remove some
                filters to see more of the collection.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white hover:bg-[#9e405a]"
              >
                View all fragrances
              </button>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                className="rounded-2xl border border-[#dfd3d7] bg-white px-5 py-3 text-sm font-medium text-[#756b6e] transition hover:border-[#c96a82] hover:text-[#9e405a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="rounded-2xl bg-[#f7e5e9] px-5 py-3 text-sm font-semibold text-[#9e405a]">
                {page}
              </span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
                className="rounded-2xl border border-[#dfd3d7] bg-white px-5 py-3 text-sm font-medium text-[#756b6e] transition hover:border-[#c96a82] hover:text-[#9e405a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}