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
    <main>
      <StorefrontHeader />

      <section className="page">
        <Link href="/products" className="breadcrumb">
          Shop / {product.category_name || "Fragrances"}
        </Link>

        <div className="detail">
          {/* Product images */}
          <div
            className={
              images.length > 1
                ? "gallery"
                : "gallery gallery-single"
            }
          >
            {images.length > 1 && (
              <div className="thumbs">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    style={{
                      borderColor:
                        selectedImage === index
                          ? "var(--rose)"
                          : "var(--border)",
                    }}
                    aria-label={`${product.name} image ${index + 1}`}
                  >
                    <ProductImage
                      src={image.url}
                      alt={
                        image.alt_text ||
                        `${product.name} image ${index + 1}`
                      }
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="main-image">
              <ProductImage
                src={currentImage}
                alt={
                  images[selectedImage]?.alt_text || product.name
                }
                eager
              >
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    padding: 24,
                    textAlign: "center",
                  }}
                >
                  <span className="font-serif text-3xl text-primary">
                    Bethel Perfume
                  </span>
                </div>
              </ProductImage>

              {hasPromotion && (
                <span className="badge badge-pink">
                  {product.promotion_text || "Special offer"}
                </span>
              )}
            </div>
          </div>

            {/* Product information */}
            <div className="detail-copy">
              <span className="eyebrow">
                {product.category_name || product.brand || "Perfume"}
                {product.size ? ` · ${product.size}` : ""}
              </span>

              <h1>{product.name}</h1>

              {/* Price */}
              <strong className="price">
                {hasPromotion ? (
                  <>
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "var(--muted2)",
                        fontWeight: 400,
                        marginRight: 10,
                      }}
                    >
                      {formatPrice(product.price, product.currency)}
                    </span>
                    {formatPrice(
                      product.promotion_price!,
                      product.currency
                    )}
                  </>
                ) : (
                  formatPrice(product.price, product.currency)
                )}
              </strong>

              {/* Description */}
              {product.description && (
                <p style={{ whiteSpace: "pre-line" }}>
                  {product.description}
                </p>
              )}

              {/* Details */}
              <div className="notes">
                <div>
                  <span>Size</span>
                  <b>{product.size || "Standard"}</b>
                </div>

                <div>
                  <span>Availability</span>
                  <b
                    style={{
                      color: isOutOfStock
                        ? "var(--danger)"
                        : "var(--success)",
                    }}
                  >
                    {stockLabel}
                  </b>
                </div>

                <div>
                  <span>Payment</span>
                  <b>Cash on delivery</b>
                </div>
              </div>

              {/* Cart action */}
              <div className="purchase">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                >
                  {isOutOfStock
                    ? "Currently unavailable"
                    : added
                      ? "Added to bag ✓"
                      : "Add to bag"}
                </button>
              </div>

              <div className="delivery-note">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m4 7 8-4 8 4-8 4-8-4Z" />
                  <path d="M4 7v10l8 4 8-4V7M12 11v10" />
                </svg>
                <div>
                  <b>Delivery in Addis Ababa</b>
                  <span>
                    Usually delivered within 1–2 business days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

      <StorefrontFooter />

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={drawerItems}
      />
    </main>
  );
}