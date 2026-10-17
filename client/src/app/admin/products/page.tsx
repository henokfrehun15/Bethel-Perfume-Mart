"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import Skeleton from "@/components/Skeleton";
import Icon from "@/components/admin/Icon";
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

/* Figma AdminHeader: eyebrow + serif title, notification bell + action. */
function AdminHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-head">
      <div>
        <span>{eyebrow}</span>

        <h1>{title}</h1>
      </div>

      <div className="admin-head-actions">
        <button className="notification" aria-label="Notifications">
          ○<i />
        </button>

        {action}
      </div>
    </div>
  );
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

  return (
    <>
      <AdminHeader
        eyebrow="Catalog"
        title="Products"
        action={
          <Link
            href="/admin/products/new"
            className="btn btn-primary"
            style={{
              padding: "0.7rem 1.2rem",
              fontSize: "0.78rem",
            }}
          >
            + New product
          </Link>
        }
      />

      {error && (
        <div className="bethel-alert bethel-alert-error mb-4">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <form onSubmit={handleSearch} className="admin-toolbar">
        <label className="search">
          <Icon name="search" size={16} />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All categories ↓</option>

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
        >
          <option value="">All stock ↓</option>

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
        >
          <option value="">All visibility ↓</option>

          <option value="promotion">
            On promotion
          </option>
        </select>

        <button type="button" onClick={clearFilters}>
          Clear
        </button>
      </form>

      {/* Product table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <>
                {[0, 1, 2, 3, 4].map((row) => (
                  <tr key={row}>
                    <td>
                      <div className="product-cell">
                        <Skeleton className="h-11 w-9" />

                        <Skeleton className="h-4 w-28" />
                      </div>
                    </td>

                    <td>
                      <Skeleton className="h-4 w-24" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-20" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-14" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-16" />
                    </td>

                    <td>
                      <Skeleton className="h-4 w-20" />
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
                  <p className="text-sm text-[#756B6E]">
                    No products found. Try changing your filters or add
                    your first fragrance.
                  </p>

                  <Link
                    href="/admin/products/new"
                    className="btn btn-primary"
                    style={{
                      margin: "18px auto 0",
                      padding: "0.7rem 1.2rem",
                      fontSize: "0.78rem",
                    }}
                  >
                    Add product
                  </Link>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    opacity: product.is_active ? 1 : 0.7,
                  }}
                >
                  {/* Product */}
                  <td>
                    <div className="product-cell">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        className="h-11 w-9 shrink-0 rounded-md object-cover"
                      >
                        <div
                          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md"
                          style={{
                            background: "#F7E5E9",
                            color: "#9E405A",
                          }}
                        >
                          <Icon name="box" size={14} />
                        </div>
                      </ProductImage>

                      <b>{product.name}</b>
                    </div>
                  </td>

                  {/* Category */}
                  <td>{product.category_name}</td>

                  {/* Price */}
                  <td>
                    {product.price} {product.currency}

                    {product.is_promotion &&
                      product.promotion_price && (
                        <div
                          style={{
                            color: "#687565",
                            fontSize: "0.62rem",
                          }}
                        >
                          Promo:{" "}
                          {product.promotion_price}{" "}
                          {product.currency}
                        </div>
                      )}
                  </td>

                  {/* Stock */}
                  <td>{product.stock_qty}</td>

                  {/* Visibility */}
                  <td>
                    {product.is_active ? (
                      <span className="badge badge-green">
                        Active
                      </span>
                    ) : (
                      <span className="badge badge-neutral">
                        Hidden
                      </span>
                    )}

                    {product.is_featured && (
                      <span
                        className="badge badge-pink"
                        style={{ marginLeft: 6 }}
                      >
                        Featured
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="icon-actions">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        aria-label="Edit product"
                        title="Edit"
                      >
                        <Icon name="edit" size={15} />
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleVisibility(product)
                        }
                        aria-label={
                          product.is_active
                            ? "Hide product"
                            : "Publish product"
                        }
                        title={product.is_active ? "Hide" : "Publish"}
                      >
                        <Icon name="eye" size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(product)
                        }
                        aria-label="Delete product"
                        title="Delete"
                        style={{ color: "#B94A5C" }}
                      >
                        <Icon name="trash" size={15} />
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
        <div className="result-meta">
          <span>
            Showing {(page - 1) * limit + 1}–
            {Math.min(page * limit, total)} of {total}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(current - 1, 1)
                )
              }
              style={{
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: "0.7rem",
              }}
            >
              ← Previous
            </button>

            <span className="badge badge-neutral">
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
              style={{
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: "0.7rem",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
