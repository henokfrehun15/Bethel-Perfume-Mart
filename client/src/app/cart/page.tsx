"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Skeleton from "@/components/Skeleton";
import ProductImage from "@/components/storefront/ProductImage";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
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
  const [loaded, setLoaded] = useState(false);

  const loadCart = () => {
    const cart = getCart();

    setItems(cart);
    setSubtotal(getCartSubtotal());
    setLoaded(true);
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
              Your selection
            </p>

            <h1 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
              Your fragrance bag
            </h1>

            <p className="mt-4 text-base leading-7 text-muted">
              Review your selected fragrances before continuing to checkout.
            </p>
          </div>

          {!loaded ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {[0, 1, 2].map((row) => (
                  <Skeleton
                    key={row}
                    className="h-36 rounded-3xl"
                  />
                ))}
              </div>

              <Skeleton className="h-72 rounded-3xl" />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-[#d9c4ca] bg-white/80 px-6 py-16 text-center shadow-[0_12px_40px_rgba(120,70,85,0.05)]">
              <p className="font-serif text-2xl text-foreground">
                Your cart is empty
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                Discover a fragrance from our collection and add it to your
                bag.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
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
                      className="rounded-3xl border border-border bg-white/90 p-4 shadow-[0_12px_40px_rgba(120,70,85,0.05)] sm:p-5"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/products/${item.slug}`}
                          className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-primary-light sm:h-32 sm:w-28"
                        >
                          <ProductImage
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          >
                            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-primary-dark">
                              Bethel Perfume
                            </div>
                          </ProductImage>
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/products/${item.slug}`}
                                className="font-serif text-xl text-foreground transition hover:text-primary-dark"
                              >
                                {item.name}
                              </Link>

                              {item.size && (
                                <p className="mt-1 text-sm text-muted">
                                  {item.size}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-sm text-primary-dark transition hover:text-primary"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center rounded-2xl border border-input bg-background">
                              <button
                                type="button"
                                onClick={() =>
                                  changeQuantity(
                                    item.productId,
                                    item.quantity - 1
                                  )
                                }
                                className="h-10 w-10 text-lg text-muted transition hover:text-primary-dark"
                              >
                                −
                              </button>

                              <span className="w-10 text-center text-sm font-semibold text-foreground">
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
                                className="h-10 w-10 text-lg text-muted transition hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>

                            <p className="font-semibold text-foreground">
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
              <aside className="h-fit rounded-3xl border border-border bg-white/90 p-6 shadow-[0_12px_40px_rgba(120,70,85,0.06)] lg:sticky lg:top-6">
                <p className="font-serif text-2xl text-foreground">
                  Order summary
                </p>

                <div className="mt-6 space-y-3 border-b border-border pb-5">
                  <div className="flex justify-between gap-4 text-sm text-muted">
                    <span>Items</span>
                    <span>
                      {items.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm text-muted">
                    <span>Subtotal</span>
                    <span>
                      {items[0]?.currency || "ETB"} {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm text-muted">
                    <span>Delivery</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="font-serif text-xl text-foreground">
                    Total
                  </span>

                  <span className="text-lg font-semibold text-primary-dark">
                    {items[0]?.currency || "ETB"} {subtotal.toFixed(2)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Proceed to checkout
                </Link>

                <Link
                  href="/products"
                  className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-[#d9c4ca] px-6 py-3 text-sm font-medium text-primary-dark transition hover:bg-primary-light"
                >
                  Continue shopping
                </Link>
              </aside>
            </div>
          )}
        </section>

        <StorefrontFooter />
      </div>
    </main>
  );
}