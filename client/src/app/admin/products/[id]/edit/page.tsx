"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import Skeleton from "@/components/Skeleton";
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
  is_active: boolean;
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
      <div>
        <Skeleton className="h-9 w-56" />

        <div className="mt-6 space-y-5">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bethel-alert bethel-alert-error">{error}</div>
    );
  }

  if (!product) {
    return (
      <div className="admin-card flex min-h-[280px] items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-xl font-medium">
            Product not found
          </h2>

          <p className="mt-2 text-sm text-[#756B6E]">
            The product you are trying to edit could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <span>Catalog</span>

          <h1>Edit product</h1>
        </div>

        <div className="admin-head-actions">
          <span className="badge badge-pink">
            Product #{product.id}
          </span>
        </div>
      </div>

      <ProductForm product={product} />
    </>
  );
}