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
      <div className="py-12 text-center text-gray-500">
        Loading product...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center text-gray-500">
        Product not found.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Edit Product
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Update {product.name}.
        </p>
      </div>

      <ProductForm product={product} />
    </div>
  );
}