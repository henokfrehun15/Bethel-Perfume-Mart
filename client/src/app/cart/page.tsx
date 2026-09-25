"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import {
  CartItem,
  getCart,
  getCartSubtotal,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/cart";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);

  const loadCart = () => {
    const cart = getCart();

    setItems(cart);
    setSubtotal(getCartSubtotal());
  };

  useEffect(() => {
    // Schedule initial load to avoid synchronous setState during effect execution
    queueMicrotask(() => {
      loadCart();
    });

    window.addEventListener("bethel-cart-updated", loadCart);

    return () => {
      window.removeEventListener("bethel-cart-updated", loadCart);
    };
  }, []);

  const changeQuantity = (productId: number, quantity: number) => {
    updateCartQuantity(productId, quantity);
    loadCart();
  };

  const removeItem = (productId: number) => {
    removeFromCart(productId);
    loadCart();
  };

  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container py-12 md:py-16">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
              Your selection
            </p>

            <h1 className="font-serif text-4xl leading-tight text-[#30272a] md:text-5xl">
              Your fragrance bag
            </h1>

            <p className="mt-4 text-base leading-7 text-[#756b6e]">
              Review your selected fragrances before continuing to checkout.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-[#d9c4ca] bg-white/80 px-6 py-16 text-center shadow-[0_12px_40px_rgba(120,70,85,0.05)]">
              <p className="font-serif text-2xl text-[#30272a]">
                Your cart is empty
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756b6e]">
                Discover a fragrance from our collection and add it to your
                bag.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
              >
                Explore fragrances
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
              {/* Cart items */}
              <div className="space-y-4">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;

                  return (
                    <article
                      key={item.productId}
                      className="rounded-3xl border border-[#eadfe2] bg-white/90 p-4 shadow-[0_12px_40px_rgba(120,70,85,0.05)] sm:p-5"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/products/${item.slug}`}
                          className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f7e5e9] sm:h-32 sm:w-28"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[#9e405a]">
                              Bethel Perfume
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/products/${item.slug}`}
                                className="font-serif text-xl text-[#30272a] transition hover:text-[#9e405a]"
                              >
                                {item.name}
                              </Link>

                              {item.size && (
                                <p className="mt-1 text-sm text-[#756b6e]">
                                  {item.size}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-sm text-[#9e405a] transition hover:text-[#c96a82]"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center rounded-2xl border border-[#dfd3d7] bg-[#fffcfa]">
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(
                                    item.productId,
                                    item.quantity - 1
                                  )
                                }
                                className="h-10 w-10 text-lg text-[#756b6e] transition hover:text-[#9e405a]"
                              >
                                −
                              </button>

                              <span className="w-10 text-center text-sm font-semibold text-[#30272a]">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                disabled={item.quantity >= item.stockQty}
                                onClick={() =>
                                  changeQuantity(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                                className="h-10 w-10 text-lg text-[#756b6e] transition hover:text-[#9e405a] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>

                            <p className="font-semibold text-[#30272a]">
                              {item.currency} {itemTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Summary */}
              <aside className="h-fit rounded-3xl border border-[#eadfe2] bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.06)] lg:sticky lg:top-6">
                <p className="font-serif text-2xl text-[#30272a]">
                  Order summary
                </p>

                <div className="mt-6 space-y-3 border-b border-[#eadfe2] pb-5">
                  <div className="flex justify-between gap-4 text-sm text-[#756b6e]">
                    <span>Items</span>
                    <span>
                      {items.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm text-[#756b6e]">
                    <span>Subtotal</span>
                    <span>
                      {items[0]?.currency || "ETB"} {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm text-[#756b6e]">
                    <span>Delivery</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="font-serif text-xl text-[#30272a]">
                    Total
                  </span>

                  <span className="text-lg font-semibold text-[#9e405a]">
                    {items[0]?.currency || "ETB"} {subtotal.toFixed(2)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
                >
                  Proceed to checkout
                </Link>

                <Link
                  href="/products"
                  className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-[#d9c4ca] px-6 py-3 text-sm font-medium text-[#9e405a] transition hover:bg-[#f7e5e9]"
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