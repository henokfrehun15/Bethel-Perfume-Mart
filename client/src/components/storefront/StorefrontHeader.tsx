"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart";

export default function StorefrontHeader() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCart = () => {
      setCartCount(getCartCount());
    };

    updateCart();

    window.addEventListener(
      "bethel-cart-updated",
      updateCart
    );

    return () => {
      window.removeEventListener(
        "bethel-cart-updated",
        updateCart
      );
    };
  }, []);

  return (
    <header className="border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="bethel-container flex min-h-20 items-center justify-between gap-6">
        <Link
          href="/"
          className="font-serif text-2xl text-primary-dark"
        >
          Bethel Perfume
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/products"
            className="font-medium text-muted transition hover:text-primary-dark"
          >
            Collection
          </Link>

          <Link
            href="/track"
            className="font-medium text-muted transition hover:text-primary-dark"
          >
            Track
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 font-medium text-muted transition hover:text-primary-dark"
          >
            Cart

            {cartCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}