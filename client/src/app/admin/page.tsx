"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import { apiRequest } from "@/lib/api";

interface ProductsResponse {
  success: boolean;
  count: number;
  total: number;
  data: unknown[];
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  data: unknown[];
}

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface RecentOrder {
  order_number: string;
  customer_name: string;
  currency: string;
  total: string | number;
  status: OrderStatus;
  created_at: string;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  by_status: Record<string, number>;
  revenue: Array<{
    currency: string;
    revenue: string | number;
    count: number;
  }>;
  low_stock: number;
  recent_orders: RecentOrder[];
}

interface OrderStatsResponse {
  success: boolean;
  data: OrderStats;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-[#fbf4e7] text-[#9a7538] border-[#eee0bf]",
  CONFIRMED: "bg-[#eef3fb] text-[#4a6288] border-[#d8e2f0]",
  PROCESSING: "bg-[#f1ecfa] text-[#6a5595] border-[#e0d6ef]",
  SHIPPED: "bg-[#eef6f9] text-[#3f7285] border-[#d3e8ef]",
  DELIVERED: "bg-[#edf5ee] text-[#687565] border-[#dce9de]",
  CANCELLED: "bg-[#fbecef] text-[#a4475e] border-[#efd0d8]",
};

function formatPrice(price: string | number, currency: string) {
  return `${currency} ${Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<number | null>(null);
  const [categories, setCategories] = useState<number | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          productsResponse,
          categoriesResponse,
          statsResponse,
        ] = await Promise.all([
          apiRequest<ProductsResponse>(
            "/products?limit=1&includeInactive=true"
          ),
          apiRequest<CategoriesResponse>("/categories"),
          apiRequest<OrderStatsResponse>("/orders/stats"),
        ]);

        setProducts(productsResponse.total);
        setCategories(categoriesResponse.count);
        setStats(statsResponse.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard"
        );
      }
    };

    loadStats();
  }, []);

  return (
    <div className="bethel-page">
      {/* Decorative background */}
      <div className="pointer-events-none absolute right-0 top-0 -z-0 h-64 w-64 rounded-full bg-primary-light opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-80 -z-0 h-48 w-48 rounded-full bg-primary-light opacity-40 blur-3xl" />

      <div className="relative z-10">
        {/* Page heading */}
        <div className="mb-8">
          <div className="bethel-label mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-primary" />
            Admin Overview
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="bethel-title text-3xl sm:text-4xl">
                Welcome to your dashboard
              </h2>

              <p className="bethel-muted mt-2 max-w-xl">
                Manage your Bethel Perfume catalog, collections, and store
                settings from one place.
              </p>
            </div>

            <div className="hidden sm:block">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e8c2cc] bg-white shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6 text-primary"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c1.8 3.1 4.9 4.7 7 5.5-.3 5.8-2.6 10-7 12.5-4.4-2.5-6.7-6.7-7-12.5C5.1 7.7 8.2 6.1 12 3Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8.5c1.2 1.3 1.7 2.5 1.7 3.7 0 1.5-.7 2.5-1.7 3.3-1-.8-1.7-1.8-1.7-3.3 0-1.2.5-2.4 1.7-3.7Z"
                  />
                </svg>
              </div>
            </div>
          </div>
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
                <p className="font-medium">Unable to load dashboard</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key numbers */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bethel-card p-5">
            <p className="bethel-label">Orders</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {stats ? stats.total_orders : <Skeleton className="h-9 w-16" />}
            </p>

            <p className="mt-1 text-sm text-muted">
              All customer orders
            </p>
          </div>

          <div className="bethel-card p-5">
            <p className="bethel-label">Pending</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {stats ? stats.pending_orders : <Skeleton className="h-9 w-16" />}
            </p>

            <p className="mt-1 text-sm text-muted">
              Waiting to be confirmed
            </p>
          </div>

          <div className="bethel-card p-5">
            <p className="bethel-label">Revenue</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {stats ? (
                stats.revenue.length > 0 ? (
                  formatPrice(
                    stats.revenue[0].revenue,
                    stats.revenue[0].currency
                  )
                ) : (
                  formatPrice(0, "ETB")
                )
              ) : (
                <Skeleton className="h-9 w-24" />
              )}
            </p>

            <p className="mt-1 text-sm text-muted">
              Excludes cancelled orders
            </p>
          </div>

          <div className="bethel-card p-5">
            <p className="bethel-label">Low stock</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {stats ? stats.low_stock : <Skeleton className="h-9 w-16" />}
            </p>

            <p className="mt-1 text-sm text-muted">
              Active products at 5 units or fewer
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Products */}
          <div className="bethel-card bethel-card-hover group relative overflow-hidden p-6 sm:p-7">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-light opacity-70 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="bethel-label">Catalog</p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    Products
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
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
              </div>

              <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {products ?? <Skeleton className="h-12 w-24" />}
              </p>

              <p className="mt-2 text-sm text-muted">
                Products currently in your catalog
              </p>

              <a
                href="/admin/products"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-dark transition-colors hover:text-primary"
              >
                Manage products
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="bethel-card bethel-card-hover group relative overflow-hidden p-6 sm:p-7">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-light opacity-70 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="bethel-label">Collections</p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    Categories
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
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
                      d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {categories ?? <Skeleton className="h-12 w-24" />}
              </p>

              <p className="mt-2 text-sm text-muted">
                Fragrance collections available
              </p>

              <a
                href="/admin/categories"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-dark transition-colors hover:text-primary"
              >
                Manage categories
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="bethel-card mt-8 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <p className="bethel-label">Latest activity</p>

              <h3 className="mt-1 text-lg font-semibold text-foreground">
                Recent orders
              </h3>
            </div>

            <a
              href="/admin/orders"
              className="text-sm font-semibold text-primary-dark transition-colors hover:text-primary"
            >
              View all →
            </a>
          </div>

          {!stats ? (
            <div className="space-y-4 px-6 py-6">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-10" />
              ))}
            </div>
          ) : stats.recent_orders.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted">
              No orders yet. New orders will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-[#f0e7e9]">
              {stats.recent_orders.map((order) => (
                <li
                  key={order.order_number}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {order.order_number}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted">
                      {order.customer_name} ·{" "}
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(order.total, order.currency)}
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-8 bethel-card p-6 sm:p-7">
          <div className="mb-5">
            <p className="bethel-label">Quick Access</p>
            <h3 className="bethel-title mt-1 text-2xl">
              Store management
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/admin/orders"
              className="group rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8c2cc] hover:bg-[#fdf5f7]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  Orders
                </span>

                <span className="text-primary transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-muted">
                Review and manage customer orders
              </p>
            </a>

            <a
              href="/admin/products"
              className="group rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8c2cc] hover:bg-[#fdf5f7]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  Products
                </span>

                <span className="text-primary transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-muted">
                Add and manage fragrances
              </p>
            </a>

            <a
              href="/admin/categories"
              className="group rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8c2cc] hover:bg-[#fdf5f7]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  Categories
                </span>

                <span className="text-primary transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-muted">
                Organize fragrance collections
              </p>
            </a>

            <a
              href="/admin/settings"
              className="group rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8c2cc] hover:bg-[#fdf5f7]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  Store Settings
                </span>

                <span className="text-primary transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-muted">
                Update your store information
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}