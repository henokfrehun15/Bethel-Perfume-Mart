"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import ProductImage from "@/components/storefront/ProductImage";
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
  is_active: boolean;
  is_featured: boolean;
  is_promotion: boolean;
  promotion_price: string | number | null;
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

interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    url: string;
    size: number;
    mime: string;
  };
}

export default function ProductForm({
  product,
}: ProductFormProps) {
  const router = useRouter();

  const isEditing = Boolean(product);

  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(
    product?.description || ""
  );
  const [price, setPrice] = useState(
    String(product?.price ?? "")
  );
  const [currency, setCurrency] = useState(
    product?.currency || "ETB"
  );
  const [brand, setBrand] = useState(product?.brand || "");
  const [size, setSize] = useState(product?.size || "");

  const [stockStatus, setStockStatus] =
    useState<Product["stock_status"]>(
      product?.stock_status || "IN_STOCK"
    );

  const [stockQty, setStockQty] = useState(
    String(product?.stock_qty ?? 0)
  );

  const [featured, setFeatured] = useState(
    product?.is_featured || false
  );

  const [active, setActive] = useState(
    product?.is_active ?? true
  );

  const [promotion, setPromotion] = useState(
    product?.is_promotion || false
  );

  const [promotionPrice, setPromotionPrice] = useState(
    String(product?.promotion_price ?? "")
  );

  const [promotionText, setPromotionText] = useState(
    product?.promotion_text || ""
  );

  const [categoryId, setCategoryId] = useState(
    String(product?.category_id || "")
  );

  const [images, setImages] = useState<string[]>(
    product?.images
      ? [...product.images]
          .sort(
            (a, b) =>
              (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )
          .map((image) => image.url)
      : [""]
  );

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] =
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
    setImages((current) => [...current, ""]);
  };

  const removeImage = (index: number) => {
    // The file itself is not deleted here: the server removes stored
    // files that become unreferenced once the product is saved, so
    // cancelling the edit never leaves a product pointing at a
    // deleted file.
    setImages((current) =>
      current.filter(
        (_, imageIndex) => imageIndex !== index
      )
    );
  };

  const handleUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    // Allow re-selecting the same file after a failure.
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const body = new FormData();

      body.append("file", file);

      // No Content-Type is set here on purpose: the browser must add
      // the multipart boundary itself.
      const response = await apiRequest<UploadResponse>(
        "/uploads/images",
        { method: "POST", body }
      );

      const url = response.data.url.trim();

      setImages((current) => {
        // Replace the empty placeholder row on a fresh product.
        if (current.length === 1 && !current[0].trim()) {
          return [url];
        }

        return [...current, url];
      });
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "The image could not be uploaded."
      );
    } finally {
      setUploading(false);
    }
  };

  const updateImage = (
    index: number,
    value: string
  ) => {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? value : image
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
        description: description.trim() || null,
        price: Number(price),
        currency: currency.trim().toUpperCase(),
        brand: brand.trim() || null,
        size: size.trim() || null,
        stock_status: stockStatus,
        stock_qty: Number(stockQty),
        is_featured: featured,
        is_active: active,
        is_promotion: promotion,
        promotion_price: promotionPrice.trim()
          ? Number(promotionPrice)
          : null,
        promotion_text: promotionText.trim() || null,
        category_id: Number(categoryId),
        images: cleanImages,
      };

      const endpoint = isEditing
        ? `/products/${product?.id}`
        : "/products";

      const method = isEditing ? "PUT" : "POST";

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

  const inputClass =
    "w-full rounded-2xl border border-[#ead7dc] bg-[#fffdfc] px-4 py-3.5 text-sm text-[#30272A] outline-none transition placeholder:text-[#a69a9e] focus:border-[#C96A82] focus:ring-4 focus:ring-[#C96A82]/10";

  const selectClass =
    "w-full rounded-2xl border border-[#ead7dc] bg-[#fffdfc] px-4 py-3.5 text-sm text-[#30272A] outline-none transition focus:border-[#C96A82] focus:ring-4 focus:ring-[#C96A82]/10";

  const labelClass =
    "mb-2 block text-[13px] font-semibold tracking-wide text-[#594d51]";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 pb-10"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-[28px] border border-[#f0dce1] bg-gradient-to-br from-[#fffdfc] via-[#fff8fa] to-[#f9e9ed] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-12 text-[130px] leading-none text-[#C96A82]/10">
          ❀
        </div>

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f7e5e9] px-3 py-1.5 text-xs font-semibold text-[#9E405A]">
            <span>✦</span>
            {isEditing
              ? "Product Collection"
              : "New Collection"}
          </div>

          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#30272A] sm:text-4xl">
            {isEditing
              ? "Refine your fragrance"
              : "Add a new fragrance"}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756B6E]">
            {isEditing
              ? `Update the details for ${product?.name}.`
              : "Create a beautifully presented product for the Bethel Perfume collection."}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="mt-0.5">!</span>
          <div>
            <p className="font-semibold">
              Something went wrong
            </p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <section className="overflow-hidden rounded-[24px] border border-[#eee1e4] bg-white shadow-[0_10px_35px_rgba(92,52,61,0.05)]">
        <div className="border-b border-[#f2e7e9] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e5e9] text-[#C96A82]">
              ✿
            </div>

            <div>
              <h3 className="font-serif text-xl font-semibold text-[#30272A]">
                Basic Information
              </h3>
              <p className="mt-0.5 text-xs text-[#8b7e82]">
                The essential details customers will see.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Product name *
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              className={inputClass}
              placeholder="Rose Perfume"
            />
          </div>

          <div>
            <label className={labelClass}>
              Slug *
            </label>

            <div className="flex gap-2">
              <input
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value)
                }
                required
                className={`min-w-0 flex-1 ${inputClass}`}
                placeholder="rose-perfume"
              />

              <button
                type="button"
                onClick={generateSlug}
                className="shrink-0 rounded-2xl border border-[#e7c8d0] bg-[#fff8fa] px-4 text-xs font-semibold text-[#9E405A] transition hover:bg-[#f7e5e9]"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={5}
              className={inputClass}
              placeholder="Describe the fragrance, its character, notes, and inspiration..."
            />
          </div>

          <div>
            <label className={labelClass}>
              Brand
            </label>

            <input
              value={brand}
              onChange={(event) =>
                setBrand(event.target.value)
              }
              className={inputClass}
              placeholder="Brand name"
            />
          </div>

          <div>
            <label className={labelClass}>
              Size
            </label>

            <input
              value={size}
              onChange={(event) =>
                setSize(event.target.value)
              }
              className={inputClass}
              placeholder="100ml"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="overflow-hidden rounded-[24px] border border-[#eee1e4] bg-white shadow-[0_10px_35px_rgba(92,52,61,0.05)]">
        <div className="border-b border-[#f2e7e9] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e5e9] text-[#C96A82]">
              ◇
            </div>

            <div>
              <h3 className="font-serif text-xl font-semibold text-[#30272A]">
                Pricing
              </h3>
              <p className="mt-0.5 text-xs text-[#8b7e82]">
                Set the standard selling price and currency.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[1fr_180px]">
          <div>
            <label className={labelClass}>
              Price *
            </label>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                required
                className={`${inputClass} pr-16`}
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9E405A]">
                {currency || "ETB"}
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Currency
            </label>

            <input
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value)
              }
              maxLength={3}
              className={`${inputClass} uppercase`}
            />
          </div>
        </div>
      </section>

      {/* Category & Stock */}
      <section className="overflow-hidden rounded-[24px] border border-[#eee1e4] bg-white shadow-[0_10px_35px_rgba(92,52,61,0.05)]">
        <div className="border-b border-[#f2e7e9] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e5e9] text-[#C96A82]">
              ♢
            </div>

            <div>
              <h3 className="font-serif text-xl font-semibold text-[#30272A]">
                Category & Stock
              </h3>
              <p className="mt-0.5 text-xs text-[#8b7e82]">
                Organize the product and manage availability.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-3">
          <div>
            <label className={labelClass}>
              Category *
            </label>

            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              required
              disabled={loadingCategories}
              className={selectClass}
            >
              <option value="">
                {loadingCategories
                  ? "Loading categories..."
                  : "Select category"}
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
            <label className={labelClass}>
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
              className={selectClass}
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
            <label className={labelClass}>
              Stock quantity
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={stockQty}
              onChange={(event) =>
                setStockQty(event.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Promotion */}
      <section className="overflow-hidden rounded-[24px] border border-[#eee1e4] bg-white shadow-[0_10px_35px_rgba(92,52,61,0.05)]">
        <div className="border-b border-[#f2e7e9] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e5e9] text-[#C96A82]">
              ♡
            </div>

            <div>
              <h3 className="font-serif text-xl font-semibold text-[#30272A]">
                Promotion
              </h3>
              <p className="mt-0.5 text-xs text-[#8b7e82]">
                Highlight a special price or offer.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#ead7dc] bg-[#fff9fa] p-4 transition hover:border-[#dca7b5]">
            <div>
              <p className="text-sm font-semibold text-[#30272A]">
                This product is on promotion
              </p>
              <p className="mt-1 text-xs text-[#817478]">
                Enable promotional pricing for this product.
              </p>
            </div>

            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={promotion}
                onChange={(event) =>
                  setPromotion(event.target.checked)
                }
                className="peer sr-only"
              />

              <div className="h-7 w-12 rounded-full bg-[#ddcdd1] transition peer-checked:bg-[#C96A82]" />

              <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </div>
          </label>

          {promotion && (
            <div className="mt-5 grid gap-5 rounded-2xl bg-[#fff9fa] p-4 sm:p-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
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
                  className={inputClass}
                  placeholder="Special price"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Promotion text
                </label>

                <input
                  value={promotionText}
                  onChange={(event) =>
                    setPromotionText(
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Special offer"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Visibility */}
      <section className="overflow-hidden rounded-[24px] border border-[#eee1e4] bg-white shadow-[0_10px_35px_rgba(92,52,61,0.05)]">
        <div className="border-b border-[#f2e7e9] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e5e9] text-[#C96A82]">
              ◉
            </div>

            <div>
              <h3 className="font-serif text-xl font-semibold text-[#30272A]">
                Store visibility
              </h3>
              <p className="mt-0.5 text-xs text-[#8b7e82]">
                Control whether customers can see this product.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#ead7dc] bg-[#fff9fa] p-4 transition hover:border-[#dca7b5]">
            <div>
              <p className="text-sm font-semibold text-[#30272A]">
                {active
                  ? "Published in the store"
                  : "Hidden from the store"}
              </p>

              <p className="mt-1 text-xs text-[#817478]">
                {active
                  ? "Customers can find and order this product."
                  : "Customers cannot see this product, but past orders keep working."}
              </p>
            </div>

            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) =>
                  setActive(event.target.checked)
                }
                className="peer sr-only"
              />

              <div className="h-7 w-12 rounded-full bg-[#ddcdd1] transition peer-checked:bg-[#C96A82]" />

              <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </section>

      {/* Featured */}
      <section className="overflow-hidden rounded-[24px] border border-[#eee1e4] bg-white shadow-[0_10px_35px_rgba(92,52,61,0.05)]">
        <div className="p-5 sm:p-7">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7e5e9] text-lg text-[#C96A82]">
                ★
              </div>

              <div>
                <p className="text-sm font-semibold text-[#30272A]">
                  Featured product
                </p>
                <p className="mt-1 text-xs text-[#817478]">
                  Show this fragrance in featured areas of the store.
                </p>
              </div>
            </div>

            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) =>
                  setFeatured(event.target.checked)
                }
                className="peer sr-only"
              />

              <div className="h-7 w-12 rounded-full bg-[#ddcdd1] transition peer-checked:bg-[#C96A82]" />

              <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </section>

      {/* Images */}
      <section className="overflow-hidden rounded-[24px] border border-[#eee1e4] bg-white shadow-[0_10px_35px_rgba(92,52,61,0.05)]">
        <div className="border-b border-[#f2e7e9] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7e5e9] text-[#C96A82]">
                ◌
              </div>

              <div>
                <h3 className="font-serif text-xl font-semibold text-[#30272A]">
                  Product Images
                </h3>
                <p className="mt-0.5 text-xs text-[#8b7e82]">
              Upload images or paste external image URLs.
            </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`cursor-pointer rounded-2xl bg-[#C96A82] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#b95770] ${
                  uploading
                    ? "pointer-events-none opacity-60"
                    : ""
                }`}
              >
                {uploading ? "Uploading..." : "Upload image"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleUpload}
                />
              </label>

              <button
                type="button"
                onClick={addImage}
                className="rounded-2xl bg-[#fff3f6] px-4 py-2.5 text-xs font-semibold text-[#9E405A] transition hover:bg-[#f7e5e9]"
              >
                + Add image
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-5 sm:p-7">
          {images.map((image, index) => (
            <div
              key={index}
              className="group flex flex-col gap-2 rounded-2xl border border-[#eadfe2] bg-[#fffdfc] p-3 sm:flex-row sm:items-center"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f7e5e9] text-sm text-[#C96A82]">
                <ProductImage
                  src={image}
                  alt=""
                  className="h-11 w-11 object-cover"
                >
                  {index + 1}
                </ProductImage>
              </div>

              <input
                type="text"
                value={image}
                onChange={(event) =>
                  updateImage(
                    index,
                    event.target.value
                  )
                }
                placeholder="https://example.com/image.jpg or /uploads/photo.png"
                className={`min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-sm text-[#30272A] outline-none placeholder:text-[#aaa0a3] focus:ring-0`}
              />

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeImage(index)
                  }
                  className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {uploadError && (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {uploadError}
            </p>
          )}

          <p className="text-xs leading-5 text-[#8b7e82]">
            JPEG, PNG, WebP, AVIF or GIF, up to 5 MB. The
            first image is used as the product cover.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-[24px] border border-[#eadfe2] bg-white/95 p-3 shadow-[0_12px_40px_rgba(70,40,48,0.12)] backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/products")
          }
          className="rounded-2xl border border-[#e3d4d8] bg-white px-6 py-3.5 text-sm font-semibold text-[#5d5155] transition hover:border-[#cdbbc0] hover:bg-[#fffafa]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-[#C96A82] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(201,106,130,0.25)] transition hover:bg-[#b95770] hover:shadow-[0_10px_24px_rgba(201,106,130,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
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