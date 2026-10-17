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
    <div className="drawer-wrap" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Your bag</span>
            <h2>
              {count === 0
                ? "Your bag is empty"
                : count === 1
                  ? "One lovely thing"
                  : `${count} lovely things`}
            </h2>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "0.85rem",
            }}
          >
            Add a fragrance to see it here.
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {items.map((item) => (
                <div key={item.productId} className="mini-item drawer-item">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={onClose}
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </Link>

                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={onClose}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <b>{item.name}</b>
                    </Link>
                    <span>
                      {item.size ? `${item.size} · ` : ""}Qty{" "}
                      {item.quantity}
                    </span>
                  </div>

                  <strong>
                    {item.currency}{" "}
                    {(item.price * item.quantity).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="drawer-total">
              <span>Subtotal</span>
              <b>
                {currency} {subtotal.toFixed(2)}
              </b>
            </div>

            <Link
              href="/checkout"
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: "100%", textDecoration: "none" }}
            >
              View bag &amp; checkout
            </Link>

            <button type="button" className="continue" onClick={onClose}>
              Continue shopping
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.65rem",
                color: "var(--muted)",
                marginTop: 14,
              }}
            >
              Secure checkout · Cash on delivery
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
