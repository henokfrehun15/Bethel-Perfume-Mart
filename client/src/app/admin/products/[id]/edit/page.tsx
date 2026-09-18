"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { apiRequest } from "@/lib/api";

interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
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
  promotion_price:
    | string
    | number
    | null;
  promotion_text: string | null;
  category_id: number;
  images: ProductImage[];
}

interface ProductResponse {
  success: boolean;
  data: Product;
}

export default function EditProductPage() {
  const params = useParams();

  const id = String(params.id);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response =
          await apiRequest<ProductResponse>(
            `/products/id/${id}`
          );

        setProduct(response.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="bethel-page">
        <div className="bethel-container">
          <div className="bethel-card flex min-h-[280px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#f3dce2] border-t-[#c96a82]" />

              <p className="text-sm font-medium text-[#756b6e]">
                Loading product...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bethel-page">
        <div className="bethel-container">
          <div className="bethel-alert bethel-alert-error">
            <div>
              <p className="font-semibold">
                Unable to load product
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bethel-page">
        <div className="bethel-container">
          <div className="bethel-card flex min-h-[280px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f7e5e9] text-[#9e405a]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.172 14.828 14.828 9.172M9.172 9.172l5.656 5.656"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />
                </svg>
              </div>

              <h2 className="bethel-title text-xl">
                Product not found
              </h2>

              <p className="mt-2 text-sm text-[#756b6e]">
                The product you are trying to edit could not be found.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bethel-page">
      <div className="bethel-container">
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-[#f3dce2] bg-gradient-to-br from-white via-[#fffafa] to-[#f8e7eb] px-6 py-8 shadow-sm sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f7e5e9] opacity-70" />

          <div className="pointer-events-none absolute -bottom-20 right-1/3 h-32 w-32 rounded-full bg-[#f7e5e9] opacity-40" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-[#c96a82]" />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9e405a]">
                Product Catalog
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="bethel-title text-3xl sm:text-4xl">
                  Edit Product
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756b6e] sm:text-base">
                  Update the details of{" "}
                  <span className="font-semibold text-[#30272a]">
                    {product.name}
                  </span>
                  .
                </p>
              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-[#efd0d8] bg-white/80 px-4 py-2 text-xs font-semibold text-[#9e405a] shadow-sm">
                Product #{product.id}
              </div>
            </div>
          </div>
        </div>

        <ProductForm product={product} />
      </div>
    </div>
  );
}