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
    <main>
      <StorefrontHeader />

      <section className="page cart-page">
        <div className="page-title">
          <span className="eyebrow">Your selection</span>
          <h1>
            Shopping bag{" "}
            <sup>
              {items.reduce((total, item) => total + item.quantity, 0)}
            </sup>
          </h1>
        </div>

        {!loaded ? (
          <div className="cart-layout">
            <div>
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-36 rounded-3xl" />
              ))}
            </div>
            <Skeleton className="h-72 rounded-3xl" />
          </div>
        ) : items.length === 0 ? (
          <div
            className="state-page"
            style={{ minHeight: "auto", padding: "60px 20px" }}
          >
            <div className="state-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 8h14l-1 12H6L5 8Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
            </div>
            <h1 style={{ fontSize: "2.6rem" }}>
              Your bag is waiting
            </h1>
            <p>
              Beautiful things belong here. Explore our fragrances to
              find your next favorite.
            </p>
            <Link href="/products" className="btn btn-primary">
              Browse fragrances
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart items */}
            <div>
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;

                  return (
                    <article key={item.productId} className="line-item">
                      <Link href={`/products/${item.slug}`}>
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        >
                          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-primary-dark">
                            Bethel Perfume
                          </div>
                        </ProductImage>
                      </Link>

                      <div className="line-copy">
                        <div>
                          <span>{item.size || "Perfume"}</span>
                          <h3>
                            <Link
                              href={`/products/${item.slug}`}
                              style={{
                                color: "inherit",
                                textDecoration: "none",
                              }}
                            >
                              {item.name}
                            </Link>
                          </h3>
                          <b>
                            {item.currency} {itemTotal.toFixed(2)}
                          </b>
                        </div>

                        <div className="line-actions">
                          <div className="stepper small">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                changeQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                            >
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={item.quantity >= item.stockQty}
                              onClick={() =>
                                changeQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="remove"
                            onClick={() => removeItem(item.productId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Summary */}
              <aside className="summary">
                <h3>Order summary</h3>

                <div>
                  <span>Items</span>
                  <b>
                    {items.reduce(
                      (total, item) => total + item.quantity,
                      0
                    )}
                  </b>
                </div>

                <div>
                  <span>Subtotal</span>
                  <b>
                    {items[0]?.currency || "ETB"} {subtotal.toFixed(2)}
                  </b>
                </div>

                <div>
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>

                <hr />

                <div className="total">
                  <span>Total</span>
                  <b>
                    {items[0]?.currency || "ETB"} {subtotal.toFixed(2)}
                  </b>
                </div>

                <Link
                  href="/checkout"
                  className="btn btn-primary"
                  style={{ textDecoration: "none" }}
                >
                  Continue to checkout
                </Link>

                <small>Secure checkout · Cash on delivery</small>
              </aside>
            </div>
          )}
        </section>

      <StorefrontFooter />
    </main>
  );
}