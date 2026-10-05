"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import Skeleton from "@/components/Skeleton";
import ProductImage from "@/components/storefront/ProductImage";
import { apiRequest } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string | number;
  currency: string;
  brand: string | null;
  size: string | null;
  stock_status:
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK";
  stock_qty: number;
  is_active: boolean;
  is_featured: boolean;
  is_promotion: boolean;
  promotion_price: string | number | null;
  image: string | null;
  category_id: number;
  category_name: string;
  category_slug: string;
}

interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  limit: number;
  offset: number;
  data: Product[];
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  data: {
    id: number;
    name: string;
    slug: string;
  }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    CategoriesResponse["data"]
  >([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [promotionFilter, setPromotionFilter] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 10;

  const totalPages = Math.max(
    Math.ceil(total / limit),
    1
  );

  const loadCategories = useCallback(
    async () => {
      try {
        const response =
          await apiRequest<CategoriesResponse>(
            "/categories"
          );

        setCategories(response.data);
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error
        );
      }
    },
    []
  );

  const loadProducts = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        params.set("limit", String(limit));
        params.set(
          "offset",
          String((page - 1) * limit)
        );

        // The admin list must see hidden products too.
        params.set("includeInactive", "true");

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (category) {
          params.set("category", category);
        }

        if (stockFilter === "in-stock") {
          params.set("inStock", "true");
        }

        if (promotionFilter === "promotion") {
          params.set("promotion", "true");
        }

        const response =
          await apiRequest<ProductsResponse>(
            `/products?${params.toString()}`
          );

        setProducts(response.data);
        setTotal(response.total);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      search,
      category,
      stockFilter,
      promotionFilter,
    ]
  );

  useEffect(() => {
    queueMicrotask(() => {
      loadCategories();
    });
  }, [loadCategories]);

  useEffect(() => {
    queueMicrotask(() => {
      loadProducts();
    });
  }, [loadProducts]);

  const handleSearch = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setPage(1);
  };

  const applyVisibility = async (
    product: Product,
    isActive: boolean
  ) => {
    try {
      await apiRequest(`/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: isActive }),
      });

      await loadProducts();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to update visibility"
      );
    }
  };

  const handleToggleVisibility = (product: Product) => {
    const confirmed = window.confirm(
      product.is_active
        ? `Hide "${product.name}" from the store? Customers will no longer see it, but past orders keep working.`
        : `Publish "${product.name}" back to the store?`
    );

    if (!confirmed) {
      return;
    }

    return applyVisibility(product, !product.is_active);
  };

  const handleDelete = async (
    product: Product
  ) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      await loadProducts();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete product";

      // Products already referenced by orders cannot be hard
      // deleted — offer hiding them from the store instead.
      if (message.includes("cannot be deleted")) {
        const hideInstead = window.confirm(
          `${message}\n\nHide "${product.name}" from the store instead?`
        );

        if (hideInstead) {
          await applyVisibility(product, false);
        }

        return;
      }

      window.alert(message);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStockFilter("");
    setPromotionFilter("");
    setPage(1);
  };

  const getStockClasses = (
    status: Product["stock_status"]
  ) => {
    if (status === "IN_STOCK") {
      return "bg-[#edf5ee] text-[#687565] border-[#dce9de]";
    }

    if (status === "LOW_STOCK") {
      return "bg-[#fbf4e7] text-[#9a7538] border-[#eee0bf]";
    }

    return "bg-[#fbecef] text-[#a4475e] border-[#efd0d8]";
  };

  return (
    <div className="bethel-page">
      {/* Decorative background */}
      <div className="pointer-events-none absolute right-0 top-0 -z-0 h-72 w-72 rounded-full bg-primary-light opacity-60 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="bethel-label mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            Fragrance Catalog
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="bethel-title text-3xl sm:text-4xl">
                Products
              </h2>

              <p className="bethel-muted mt-2 max-w-xl">
                Manage your fragrances, pricing, stock,
                promotions, and featured products.
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="bethel-button bethel-button-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <span className="text-lg leading-none">
                +
              </span>
              Add Product
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bethel-card mb-6 p-5 sm:p-6">
          <div className="mb-4">
            <p className="bethel-label">
              Catalog Filters
            </p>

            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Find a fragrance
            </h3>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-5"
          >
            {/* Search */}
            <div className="relative lg:col-span-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a99da0]"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                />
                <path
                  strokeLinecap="round"
                  d="m16 16 4 4"
                />
              </svg>

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="bethel-input pl-10"
              />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="bethel-input"
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

            {/* Stock */}
            <select
              value={stockFilter}
              onChange={(event) => {
                setStockFilter(event.target.value);
                setPage(1);
              }}
              className="bethel-input"
            >
              <option value="">
                All stock
              </option>

              <option value="in-stock">
                In stock
              </option>
            </select>

            {/* Promotion */}
            <select
              value={promotionFilter}
              onChange={(event) => {
                setPromotionFilter(
                  event.target.value
                );
                setPage(1);
              }}
              className="bethel-input"
            >
              <option value="">
                All products
              </option>

              <option value="promotion">
                Promotions
              </option>
            </select>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bethel-button bethel-button-primary flex-1"
              >
                Search
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="bethel-button bethel-button-secondary"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bethel-alert bethel-alert-error mb-6">
            <div className="flex items-start gap-3">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="mt-0.5 h-5 w-5 shrink-0"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.3 3.9 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                />
              </svg>

              <div>
                <p className="font-medium">
                  Unable to load products
                </p>

                <p className="mt-1 text-sm">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Product count */}
        {!loading && total > 0 && (
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {total}
              </span>{" "}
              {total === 1
                ? "product"
                : "products"}{" "}
              in catalog
            </p>
          </div>
        )}

        {/* Product table */}
        <div className="bethel-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-[#fdf8f9]">
                <tr>
                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Product
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Category
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Price
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Stock
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold text-[#574b4f]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <>
                    {[0, 1, 2, 3, 4].map((row) => (
                      <tr
                        key={row}
                        className="border-b border-[#f0e7e9]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-14 w-14 rounded-xl" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-14" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-9 w-24 rounded-lg" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-7 w-7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 7h10l2 3v9H5v-9l2-3Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 7a3 3 0 0 1 6 0"
                            />
                          </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-foreground">
                          No products found
                        </h3>

                        <p className="mt-1 text-sm text-muted">
                          Try changing your filters or add
                          your first fragrance.
                        </p>

                        <Link
                          href="/admin/products/new"
                          className="bethel-button bethel-button-primary mt-5"
                        >
                          Add Product
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-[#f0e7e9] transition-colors last:border-b-0 hover:bg-[#fffbfc] ${
                        product.is_active ? "" : "opacity-70"
                      }`}
                    >
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover shadow-sm"
                          >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-[#fdf5f7] text-primary">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-6 w-6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 7h10l2 3v9H5v-9l2-3Z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 7a3 3 0 0 1 6 0"
                                />
                              </svg>
                            </div>
                          </ProductImage>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {product.name}
                            </p>

                            {product.brand && (
                              <p className="mt-0.5 text-xs text-muted">
                                {product.brand}
                                {product.size
                                  ? ` · ${product.size}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
                          {product.category_name}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-semibold text-foreground">
                            {product.price}{" "}
                            {product.currency}
                          </span>

                          {product.is_promotion &&
                            product.promotion_price && (
                              <p className="mt-1 text-xs font-medium text-[#687565]">
                                Promo:{" "}
                                {product.promotion_price}{" "}
                                {product.currency}
                              </p>
                            )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-foreground">
                          {product.stock_qty}
                        </span>

                        <span className="ml-1 text-xs text-muted">
                          units
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStockClasses(
                              product.stock_status
                            )}`}
                          >
                            {product.stock_status.replace(
                              "_",
                              " "
                            )}
                          </span>

                          {product.is_featured && (
                            <span className="inline-flex rounded-full border border-[#e8c2cc] bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-dark">
                              Featured
                            </span>
                          )}

                          {product.is_promotion && (
                            <span className="inline-flex rounded-full border border-[#dce9de] bg-[#edf5ee] px-2.5 py-1 text-xs font-medium text-[#687565]">
                              Promotion
                            </span>
                          )}

                          {!product.is_active && (
                            <span className="inline-flex rounded-full border border-[#e5dadd] bg-[#f4eff0] px-2.5 py-1 text-xs font-medium text-muted">
                              Hidden
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex items-center rounded-lg border border-[#e5dadd] bg-white px-3 py-2 text-xs font-semibold text-[#574b4f] transition-colors hover:border-[#d7a7b3] hover:bg-[#fdf5f7] hover:text-primary-dark"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleVisibility(product)
                            }
                            className="inline-flex items-center rounded-lg border border-[#e5dadd] bg-white px-3 py-2 text-xs font-semibold text-[#574b4f] transition-colors hover:border-[#d7a7b3] hover:bg-[#fdf5f7] hover:text-primary-dark"
                          >
                            {product.is_active
                              ? "Hide"
                              : "Publish"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(product)
                            }
                            className="inline-flex items-center rounded-lg border border-[#efd0d8] bg-white px-3 py-2 text-xs font-semibold text-[#a4475e] transition-colors hover:bg-[#fbecef]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(page - 1) * limit + 1}–
                  {Math.min(page * limit, total)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {total}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(current - 1, 1)
                    )
                  }
                  className="bethel-button bethel-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="rounded-lg bg-primary-light px-3 py-2 text-xs font-semibold text-primary-dark">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        current + 1,
                        totalPages
                      )
                    )
                  }
                  className="bethel-button bethel-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}