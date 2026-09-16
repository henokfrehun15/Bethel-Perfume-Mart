"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductImage {
  id?: number;
  url: string;
  alt_text?: string | null;
  sort_order?: number;
}

interface Product {
  id?: number;
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
  images?: ProductImage[];
}

interface ProductFormProps {
  product?: Product;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface ProductResponse {
  success: boolean;
  data: Product;
}

export default function ProductForm({
  product,
}: ProductFormProps) {
  const router = useRouter();

  const isEditing = Boolean(product);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [name, setName] = useState(
    product?.name || ""
  );

  const [slug, setSlug] = useState(
    product?.slug || ""
  );

  const [description, setDescription] =
    useState(product?.description || "");

  const [price, setPrice] = useState(
    String(product?.price ?? "")
  );

  const [currency, setCurrency] = useState(
    product?.currency || "ETB"
  );

  const [brand, setBrand] = useState(
    product?.brand || ""
  );

  const [size, setSize] = useState(
    product?.size || ""
  );

  const [stockStatus, setStockStatus] =
    useState<Product["stock_status"]>(
      product?.stock_status || "IN_STOCK"
    );

  const [stockQty, setStockQty] =
    useState(
      String(product?.stock_qty ?? 0)
    );

  const [featured, setFeatured] =
    useState(
      product?.is_featured || false
    );

  const [promotion, setPromotion] =
    useState(
      product?.is_promotion || false
    );

  const [promotionPrice, setPromotionPrice] =
    useState(
      String(product?.promotion_price ?? "")
    );

  const [promotionText, setPromotionText] =
    useState(
      product?.promotion_text || ""
    );

  const [categoryId, setCategoryId] =
    useState(
      String(product?.category_id || "")
    );

  const [images, setImages] = useState<
    string[]
  >(
    product?.images
      ?.sort(
        (a, b) =>
          (a.sort_order ?? 0) -
          (b.sort_order ?? 0)
      )
      .map((image) => image.url) || [""]
  );

  const [loading, setLoading] =
    useState(false);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response =
          await apiRequest<CategoriesResponse>(
            "/categories"
          );

        setCategories(response.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load categories"
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const generateSlug = () => {
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlug(generated);
  };

  const addImage = () => {
    setImages((current) => [
      ...current,
      "",
    ]);
  };

  const removeImage = (index: number) => {
    setImages((current) =>
      current.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };

  const updateImage = (
    index: number,
    value: string
  ) => {
    setImages((current) =>
      current.map(
        (image, imageIndex) =>
          imageIndex === index
            ? value
            : image
      )
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const cleanImages = images
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({
          url,
        }));

      const body = {
        name: name.trim(),
        slug: slug.trim(),
        description:
          description.trim() || null,
        price: Number(price),
        currency: currency.trim().toUpperCase(),
        brand: brand.trim() || null,
        size: size.trim() || null,
        stock_status: stockStatus,
        stock_qty: Number(stockQty),
        is_featured: featured,
        is_promotion: promotion,
        promotion_price:
          promotionPrice.trim()
            ? Number(promotionPrice)
            : null,
        promotion_text:
          promotionText.trim() || null,
        category_id: Number(categoryId),
        images: cleanImages,
      };

      const endpoint = isEditing
        ? `/products/${product?.id}`
        : "/products";

      const method = isEditing
        ? "PUT"
        : "POST";

      await apiRequest<ProductResponse>(
        endpoint,
        {
          method,
          body: JSON.stringify(body),
        }
      );

      router.push("/admin/products");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save product"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Basic information */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold">
          Basic Information
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Product name *
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              placeholder="Rose Perfume"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Slug *
            </label>

            <div className="flex gap-2">
              <input
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value)
                }
                required
                className="min-w-0 flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="rose-perfume"
              />

              <button
                type="button"
                onClick={generateSlug}
                className="rounded-lg border px-3 text-sm hover:bg-gray-50"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={4}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              placeholder="Describe the product..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Brand
            </label>

            <input
              value={brand}
              onChange={(event) =>
                setBrand(event.target.value)
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              placeholder="Brand name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Size
            </label>

            <input
              value={size}
              onChange={(event) =>
                setSize(event.target.value)
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              placeholder="100ml"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold">
          Pricing
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Price *
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              required
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Currency
            </label>

            <input
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value)
              }
              maxLength={3}
              className="w-full rounded-lg border px-4 py-3 uppercase outline-none focus:ring-2"
            />
          </div>
        </div>
      </section>

      {/* Category and stock */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold">
          Category & Stock
        </h3>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Category *
            </label>

            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(
                  event.target.value
                )
              }
              required
              disabled={loadingCategories}
              className="w-full rounded-lg border px-4 py-3 outline-none"
            >
              <option value="">
                Select category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Stock status
            </label>

            <select
              value={stockStatus}
              onChange={(event) =>
                setStockStatus(
                  event.target
                    .value as Product["stock_status"]
                )
              }
              className="w-full rounded-lg border px-4 py-3 outline-none"
            >
              <option value="IN_STOCK">
                In stock
              </option>

              <option value="LOW_STOCK">
                Low stock
              </option>

              <option value="OUT_OF_STOCK">
                Out of stock
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Stock quantity
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={stockQty}
              onChange={(event) =>
                setStockQty(
                  event.target.value
                )
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
            />
          </div>
        </div>
      </section>

      {/* Promotion */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold">
          Promotion
        </h3>

        <label className="mb-5 flex items-center gap-3">
          <input
            type="checkbox"
            checked={promotion}
            onChange={(event) =>
              setPromotion(
                event.target.checked
              )
            }
            className="h-4 w-4"
          />

          <span className="text-sm font-medium">
            This product is on promotion
          </span>
        </label>

        {promotion && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Promotion price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={promotionPrice}
                onChange={(event) =>
                  setPromotionPrice(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Promotion text
              </label>

              <input
                value={promotionText}
                onChange={(event) =>
                  setPromotionText(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="Special offer"
              />
            </div>
          </div>
        )}
      </section>

      {/* Featured */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) =>
              setFeatured(
                event.target.checked
              )
            }
            className="h-4 w-4"
          />

          <span className="text-sm font-medium">
            Show this product as featured
          </span>
        </label>
      </section>

      {/* Images */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Product Images
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add image URLs for now. File uploading
              will be added later.
            </p>
          </div>

          <button
            type="button"
            onClick={addImage}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            + Add image
          </button>
        </div>

        <div className="space-y-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <input
                type="url"
                value={image}
                onChange={(event) =>
                  updateImage(
                    index,
                    event.target.value
                  )
                }
                placeholder="https://example.com/image.jpg"
                className="min-w-0 flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2"
              />

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeImage(index)
                  }
                  className="rounded-lg border border-red-200 px-4 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/products")
          }
          className="rounded-lg border px-6 py-3 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Product"
              : "Create Product"}
        </button>
      </div>
    </form>
  );
}