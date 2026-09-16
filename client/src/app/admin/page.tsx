"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface ProductsResponse {
  success: boolean;
  count: number;
  data: unknown[];
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  data: unknown[];
}

export default function AdminDashboard() {
  const [products, setProducts] =
    useState<number | null>(null);

  const [categories, setCategories] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          productsResponse,
          categoriesResponse,
        ] = await Promise.all([
          apiRequest<ProductsResponse>(
            "/products?limit=1"
          ),
          apiRequest<CategoriesResponse>(
            "/categories"
          ),
        ]);

        setProducts(productsResponse.count);
        setCategories(
          categoriesResponse.count
        );
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
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Dashboard
        </h2>

        <p className="mt-1 text-gray-500">
          Manage your Bethel Perfume catalog.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Products
          </p>

          <p className="mt-2 text-3xl font-bold">
            {products ?? "..."}
          </p>

          <a
            href="/admin/products"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            Manage products →
          </a>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Categories
          </p>

          <p className="mt-2 text-3xl font-bold">
            {categories ?? "..."}
          </p>

          <a
            href="/admin/categories"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            Manage categories →
          </a>
        </div>
      </div>
    </div>
  );
}