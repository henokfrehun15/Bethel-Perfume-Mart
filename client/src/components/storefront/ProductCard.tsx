import Link from "next/link";

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

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#eadfe2] bg-white shadow-[0_12px_40px_rgba(120,70,85,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(120,70,85,0.12)]">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-[#f9f0f2]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <span className="font-serif text-2xl text-[#c96a82]">
                Bethel Perfume
              </span>
            </div>
          )}

          {hasPromotion && (
            <span className="absolute left-4 top-4 rounded-full bg-[#c96a82] px-3 py-1.5 text-xs font-semibold text-white">
              {product.promotion_text || "Special offer"}
            </span>
          )}

          {product.is_featured && !hasPromotion && (
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#9e405a] shadow-sm">
              Featured
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-end bg-black/10">
              <div className="w-full bg-white/90 px-4 py-3 text-center text-sm font-medium text-[#756b6e]">
                Currently unavailable
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        {product.category_name && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c96a82]">
            {product.category_name}
          </p>
        )}

        <Link href={`/products/${product.slug}`}>
          <h3 className="font-serif text-xl text-[#30272a] transition hover:text-[#9e405a]">
            {product.name}
          </h3>
        </Link>

        {product.brand && (
          <p className="mt-1 text-sm text-[#756b6e]">
            {product.brand}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {hasPromotion ? (
              <>
                <p className="text-sm text-[#9b9093] line-through">
                  {formatPrice(product.price, product.currency)}
                </p>
                <p className="font-semibold text-[#9e405a]">
                  {formatPrice(
                    product.promotion_price!,
                    product.currency
                  )}
                </p>
              </>
            ) : (
              <p className="font-semibold text-[#30272a]">
                {formatPrice(product.price, product.currency)}
              </p>
            )}
          </div>

          {product.size && (
            <span className="text-xs text-[#756b6e]">
              {product.size}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}