import Link from "next/link";

import ProductImage from "./ProductImage";

export interface StorefrontProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  currency: string;
  brand: string | null;
  size: string | null;
  stock_status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  stock_qty: number;
  is_featured: boolean;
  is_promotion: boolean;
  promotion_price: string | number | null;
  promotion_text: string | null;
  category_id: number;
  category_name: string | null;
  category_slug: string | null;
  image: string | null;
}

interface ProductCardProps {
  product: StorefrontProduct;
}

function formatPrice(
  price: string | number,
  currency: string
) {
  const value = Number(price);

  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const hasPromotion =
    product.is_promotion &&
    product.promotion_price !== null &&
    Number(product.promotion_price) < Number(product.price);

  const isOutOfStock =
    product.stock_status === "OUT_OF_STOCK";

  const badge = hasPromotion
    ? product.promotion_text || "Special offer"
    : product.is_featured
      ? "Featured"
      : isOutOfStock
        ? "Sold out"
        : "";

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`}>
        <div className="product-image">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          >
            <div className="flex h-full items-center justify-center px-6 text-center">
              <span className="font-serif text-2xl text-primary">
                Bethel Perfume
              </span>
            </div>
          </ProductImage>

          {badge && <span className="badge badge-pink">{badge}</span>}

          {isOutOfStock && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(48,39,42,0.25)",
              }}
            />
          )}
        </div>
      </Link>

      <div className="product-info">
        <div>
          <p>
            {product.category_name ||
              product.brand ||
              (product.size ? `${product.size}` : "Perfume")}
          </p>
          <h3>
            <Link href={`/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
        </div>

        <strong>
          {hasPromotion
            ? formatPrice(
                product.promotion_price!,
                product.currency
              )
            : formatPrice(product.price, product.currency)}
        </strong>
      </div>
    </article>
  );
}
