"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import type { CartItem } from "@/lib/cart";
import ProductImage from "./ProductImage";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Cart contents at the moment the drawer opened. */
  items: CartItem[];
}

/**
 * Slide-in mini cart shown right after a product is added, so the
 * customer immediately sees what they picked and can jump straight
 * to checkout.
 */
export default function CartDrawer({
  open,
  onClose,
  items,
}: CartDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    // Lock page scroll while the drawer is open.
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const currency = items[0]?.currency || "ETB";
  const count = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="bethel-fade-in absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="bethel-drawer absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <p className="font-serif text-2xl text-foreground">
            Your bag{" "}
            <span className="font-sans text-sm font-semibold text-muted">
              ({count})
            </span>
          </p>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-muted transition hover:bg-primary-light hover:text-primary-dark"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="text-sm text-muted">
              Your bag is empty.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={onClose}
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-primary-light"
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={onClose}
                      className="block truncate font-medium text-foreground transition hover:text-primary-dark"
                    >
                      {item.name}
                    </Link>

                    <p className="mt-1 text-xs text-muted">
                      Qty {item.quantity}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    {item.currency}{" "}
                    {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Subtotal
                </span>

                <span className="font-semibold text-primary-dark">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                onClick={onClose}
                className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Checkout
              </Link>

              <Link
                href="/cart"
                onClick={onClose}
                className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-input px-6 text-sm font-medium text-primary-dark transition hover:bg-primary-light"
              >
                View cart
              </Link>

              <p className="mt-4 text-center text-xs text-muted-light">
                Cash on delivery — pay when your fragrance
                arrives.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
