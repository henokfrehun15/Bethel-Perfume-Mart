"use client";

import Link from "next/link";
import { useEffect, useState, startTransition } from "react";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import {
  CartItem,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/cart";

function formatPrice(price: number, currency: string) {
  return `${currency} ${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setItems(getCart());
      setIsMounted(true);
    });
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const currency = items[0]?.currency || "ETB";

  const handleQuantityChange = (productId: number, quantity: number) => {
    const updated = updateCartQuantity(productId, quantity);
    setItems(updated);
  };

  const handleRemove = (productId: number) => {
    const updated = removeFromCart(productId);
    setItems(updated);
  };

  if (!isMounted) {
    return (
      <main className="bethel-page min-h-screen">
        <div className="relative z-10">
          <StorefrontHeader />
          <section className="bethel-container py-12 md:py-16">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-black/5" />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container py-12 md:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
              Your selection
            </p>

            <h1 className="mt-2 font-serif text-4xl text-[#30272a] md:text-5xl">
              Shopping cart
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="mt-12 rounded-[2rem] border border-dashed border-[#d9c4ca] bg-white/80 px-6 py-20 text-center">
              <p className="font-serif text-3xl text-[#30272a]">
                Your cart is empty.
              </p>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#756b6e]">
                Discover a fragrance you love and add it to your collection.
              </p>

              <Link
                href="/products"
                className="mt-7 inline-flex rounded-2xl bg-[#c96a82] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
              >
                Explore fragrances
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.productId}
                    className="flex flex-col gap-5 rounded-3xl border border-[#eadfe2] bg-white/90 p-4 shadow-[0_10px_35px_rgba(120,70,85,0.05)] sm:flex-row sm:items-center"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      className="shrink-0 overflow-hidden rounded-2xl bg-[#f9f0f2] sm:w-32"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center px-4 text-center">
                          <span className="font-serif text-lg text-[#c96a82]">
                            Bethel
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-serif text-xl text-[#30272a] hover:text-[#9e405a]"
                      >
                        {item.name}
                      </Link>

                      {item.size && (
                        <p className="mt-1 text-sm text-[#756b6e]">
                          {item.size}
                        </p>
                      )}

                      <p className="mt-3 text-sm font-semibold text-[#30272a]">
                        {formatPrice(item.price, item.currency)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center rounded-2xl border border-[#dfd3d7]">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="px-3 py-2 text-[#756b6e] hover:text-[#9e405a]"
                        >
                          −
                        </button>

                        <span className="min-w-8 text-center text-sm font-medium text-[#30272a]">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={item.quantity >= item.stockQty}
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="px-3 py-2 text-[#756b6e] hover:text-[#9e405a] disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-[#30272a]">
                          {formatPrice(
                            item.price * item.quantity,
                            item.currency
                          )}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId)}
                          className="mt-1 text-xs font-medium text-[#9e405a] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="h-fit rounded-3xl border border-[#eadfe2] bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.07)] lg:sticky lg:top-6">
                <h2 className="font-serif text-2xl text-[#30272a]">
                  Order summary
                </h2>

                <div className="mt-6 flex items-center justify-between border-b border-[#eadfe2] pb-5 text-sm">
                  <span className="text-[#756b6e]">Subtotal</span>

                  <span className="font-semibold text-[#30272a]">
                    {formatPrice(subtotal, currency)}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-medium text-[#30272a]">Total</span>

                  <span className="text-xl font-semibold text-[#9e405a]">
                    {formatPrice(subtotal, currency)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-7 w-full rounded-2xl bg-[#c96a82] px-6 py-4 text-sm font-semibold text-white opacity-60"
                >
                  Checkout coming next
                </button>

                <Link
                  href="/products"
                  className="mt-3 flex justify-center rounded-2xl border border-[#d9c4ca] px-6 py-3.5 text-sm font-semibold text-[#9e405a] hover:bg-[#f7e5e9]"
                >
                  Continue shopping
                </Link>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}