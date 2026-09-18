"use client";

import { useEffect, useState } from "react";
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

export default function AdminDashboard() {
  const [products, setProducts] = useState<number | null>(null);
  const [categories, setCategories] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiRequest<ProductsResponse>("/products?limit=1"),
          apiRequest<CategoriesResponse>("/categories"),
        ]);

        setProducts(productsResponse.total);
        setCategories(categoriesResponse.count);
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
      <div className="pointer-events-none absolute right-0 top-0 -z-0 h-64 w-64 rounded-full bg-[#f7e5e9] opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-80 -z-0 h-48 w-48 rounded-full bg-[#f7e5e9] opacity-40 blur-3xl" />

      <div className="relative z-10">
        {/* Page heading */}
        <div className="mb-8">
          <div className="bethel-label mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-[#c96a82]" />
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
                  className="h-6 w-6 text-[#c96a82]"
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

        {/* Statistics */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Products */}
          <div className="bethel-card bethel-card-hover group relative overflow-hidden p-6 sm:p-7">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#f7e5e9] opacity-70 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="bethel-label">Catalog</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#30272a]">
                    Products
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7e5e9] text-[#c96a82]">
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

              <p className="text-4xl font-semibold tracking-tight text-[#30272a] sm:text-5xl">
                {products ?? "..."}
              </p>

              <p className="mt-2 text-sm text-[#756b6e]">
                Products currently in your catalog
              </p>

              <a
                href="/admin/products"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#9e405a] transition-colors hover:text-[#c96a82]"
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
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#f7e5e9] opacity-70 transition-transform duration-500 group-hover:scale-125" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="bethel-label">Collections</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#30272a]">
                    Categories
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7e5e9] text-[#c96a82]">
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

              <p className="text-4xl font-semibold tracking-tight text-[#30272a] sm:text-5xl">
                {categories ?? "..."}
              </p>

              <p className="mt-2 text-sm text-[#756b6e]">
                Fragrance collections available
              </p>

              <a
                href="/admin/categories"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#9e405a] transition-colors hover:text-[#c96a82]"
              >
                Manage categories
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>
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
              href="/admin/products"
              className="group rounded-xl border border-[#eadfe2] bg-[#fffcfa] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8c2cc] hover:bg-[#fdf5f7]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#30272a]">
                  Products
                </span>

                <span className="text-[#c96a82] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-[#756b6e]">
                Add and manage fragrances
              </p>
            </a>

            <a
              href="/admin/categories"
              className="group rounded-xl border border-[#eadfe2] bg-[#fffcfa] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8c2cc] hover:bg-[#fdf5f7]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#30272a]">
                  Categories
                </span>

                <span className="text-[#c96a82] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-[#756b6e]">
                Organize fragrance collections
              </p>
            </a>

            <a
              href="/admin/settings"
              className="group rounded-xl border border-[#eadfe2] bg-[#fffcfa] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e8c2cc] hover:bg-[#fdf5f7]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#30272a]">
                  Store Settings
                </span>

                <span className="text-[#c96a82] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-1 text-sm text-[#756b6e]">
                Update your store information
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}