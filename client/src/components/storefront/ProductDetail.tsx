"use client";

import Link from "next/link";
import { useState } from "react";

import {
  addToCart,
  type CartItem,
} from "@/lib/cart";
import type { Product } from "@/lib/serverApi";
import CartDrawer from "./CartDrawer";
import ProductImage from "./ProductImage";
import StorefrontFooter from "./StorefrontFooter";
import StorefrontHeader from "./StorefrontHeader";

interface ProductDetailProps {
  product: Product;
}

function formatPrice(
  price: string | number,
  currency: string
) {
  return `${currency} ${Number(price).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export default function ProductDetail({
  product,
}: ProductDetailProps) {
  const [selectedImage, setSelectedImage] =
    useState(0);
  const [added, setAdded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItems, setDrawerItems] = useState<
    CartItem[]
  >([]);

  const images = [...product.images].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const currentImage =
    images[selectedImage]?.url || null;

  const hasPromotion =
    product.is_promotion &&
    product.promotion_price !== null &&
    Number(product.promotion_price) <
      Number(product.price);

  const isOutOfStock =
    product.stock_status === "OUT_OF_STOCK";

  const stockLabel =
    product.stock_status === "IN_STOCK"
      ? "In stock"
      : product.stock_status === "LOW_STOCK"
        ? "Low stock"
        : "Out of stock";

  const cartPrice = hasPromotion
    ? Number(product.promotion_price)
    : Number(product.price);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return;
    }

    setAdded(true);
    setDrawerItems(
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: cartPrice,
        currency: product.currency,
        image: images[0]?.url || null,
        size: product.size,
        quantity: 1,
        stockQty: product.stock_qty,
      })
    );
    setDrawerOpen(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container py-10 md:py-16">
          <Link
            href="/products"
            className="text-sm font-medium text-primary-dark hover:underline"
          >
            ← Back to collection
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Product images */}
            <div>
              <div className="overflow-hidden rounded-[2rem] border border-border bg-[#f9f0f2] shadow-[0_16px_50px_rgba(120,70,85,0.08)]">
                <ProductImage
                  src={currentImage}
                  alt={
                    images[selectedImage]?.alt_text ||
                    product.name
                  }
                  className="aspect-[4/5] h-full w-full object-cover"
                  eager
                >
                  <div className="flex aspect-[4/5] items-center justify-center px-8 text-center">
                    <span className="font-serif text-3xl text-primary">
                      Bethel Perfume
                    </span>
                  </div>
                </ProductImage>
              </div>

              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() =>
                        setSelectedImage(index)
                      }
                      className={`overflow-hidden rounded-2xl border-2 ${
                        selectedImage === index
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <ProductImage
                        src={image.url}
                        alt={
                          image.alt_text ||
                          `${product.name} image ${index + 1}`
                        }
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product information */}
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
                {product.brand || "Bethel Perfume"}
              </p>

              <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">
                {product.name}
              </h1>

              {product.brand && (
                <p className="mt-3 text-base text-muted">
                  {product.brand}
                </p>
              )}

              {/* Price */}
              <div className="mt-7">
                {hasPromotion ? (
                  <div>
                    <p className="text-lg text-muted-light line-through">
                      {formatPrice(
                        product.price,
                        product.currency
                      )}
                    </p>

                    <p className="text-2xl font-semibold text-primary-dark">
                      {formatPrice(
                        product.promotion_price!,
                        product.currency
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold text-foreground">
                    {formatPrice(
                      product.price,
                      product.currency
                    )}
                  </p>
                )}
              </div>

              {/* Promotion */}
              {hasPromotion &&
                product.promotion_text && (
                  <div className="mt-5 rounded-2xl bg-primary-light px-4 py-3 text-sm font-medium text-primary-dark">
                    {product.promotion_text}
                  </div>
                )}

              {/* Description */}
              {product.description && (
                <div className="mt-8 border-t border-border pt-7">
                  <h2 className="font-serif text-2xl text-foreground">
                    About this fragrance
                  </h2>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Details */}
              <div className="mt-8 grid gap-3 border-t border-border pt-7 sm:grid-cols-2">
                {product.size && (
                  <div className="rounded-2xl bg-background p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-light">
                      Size
                    </p>

                    <p className="mt-1 font-medium text-foreground">
                      {product.size}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl bg-background p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-light">
                    Availability
                  </p>

                  <p
                    className={`mt-1 font-medium ${
                      isOutOfStock
                        ? "text-[#9b5d63]"
                        : "text-[#687565]"
                    }`}
                  >
                    {stockLabel}
                  </p>
                </div>
              </div>

              {/* Cart action */}
              <div className="mt-8">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="w-full rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-[#cfc4c7]"
                >
                  {isOutOfStock
                    ? "Currently unavailable"
                    : added
                      ? "Added to cart ✓"
                      : "Add to cart"}
                </button>

                <p className="mt-3 text-center text-xs text-muted-light">
                  Cash on delivery — pay when it arrives.
                </p>
              </div>
            </div>
          </div>
        </section>

        <StorefrontFooter />
      </div>

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={drawerItems}
      />
    </main>
  );
}