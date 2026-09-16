"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

  const [stockFilter, setStockFilter] =
    useState("");

  const [promotionFilter, setPromotionFilter] =
    useState("");

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
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete product"
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStockFilter("");
    setPromotionFilter("");
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Products
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your store products.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-lg bg-black px-5 py-3 text-center text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-5"
        >
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2"
          />

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border px-4 py-3 text-sm outline-none"
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

          <select
            value={stockFilter}
            onChange={(event) => {
              setStockFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border px-4 py-3 text-sm outline-none"
          >
            <option value="">
              All stock
            </option>

            <option value="in-stock">
              In stock
            </option>
          </select>

          <select
            value={promotionFilter}
            onChange={(event) => {
              setPromotionFilter(
                event.target.value
              );
              setPage(1);
            }}
            className="rounded-lg border px-4 py-3 text-sm outline-none"
          >
            <option value="">
              All products
            </option>

            <option value="promotion">
              Promotions
            </option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              Search
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Product table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-4 font-semibold">
                  Product
                </th>

                <th className="px-4 py-4 font-semibold">
                  Category
                </th>

                <th className="px-4 py-4 font-semibold">
                  Price
                </th>

                <th className="px-4 py-4 font-semibold">
                  Stock
                </th>

                <th className="px-4 py-4 font-semibold">
                  Status
                </th>

                <th className="px-4 py-4 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            No image
                          </div>
                        )}

                        <div>
                          <p className="font-medium">
                            {product.name}
                          </p>

                          {product.brand && (
                            <p className="text-xs text-gray-500">
                              {product.brand}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {product.category_name}
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        <span className="font-medium">
                          {product.price}{" "}
                          {product.currency}
                        </span>

                        {product.is_promotion &&
                          product.promotion_price && (
                            <p className="text-xs text-green-600">
                              Promo:{" "}
                              {
                                product.promotion_price
                              }{" "}
                              {
                                product.currency
                              }
                            </p>
                          )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {product.stock_qty}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.stock_status ===
                          "IN_STOCK"
                            ? "bg-green-100 text-green-700"
                            : product.stock_status ===
                                "LOW_STOCK"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.stock_status.replace(
                          "_",
                          " "
                        )}
                      </span>

                      {product.is_featured && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Featured
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(product)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
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
          <div className="flex items-center justify-between border-t px-4 py-4">
            <p className="text-sm text-gray-500">
              Showing{" "}
              {(page - 1) * limit + 1}–
              {Math.min(
                page * limit,
                total
              )}{" "}
              of {total}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(current - 1, 1)
                  )
                }
                className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="flex items-center px-2 text-sm text-gray-500">
                Page {page} of {totalPages}
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
                className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}