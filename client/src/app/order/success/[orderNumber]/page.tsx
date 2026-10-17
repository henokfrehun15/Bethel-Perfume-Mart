"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";

export default function OrderSuccessPage() {
  const params = useParams();

  const orderNumber = String(
    params.orderNumber || ""
  );

  return (
    <main>
      <StorefrontHeader />

      <section className="success-page">
        <div className="success-mark">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>

        <span className="eyebrow">Order confirmed</span>
        <h1>Thank you for choosing Bethel.</h1>
        <p>
          Your order is in. We’ll confirm it shortly and keep you
          updated as it makes its way to you.
        </p>

        <div className="order-number">
          <span>Order number</span>
          <b style={{ fontSize: "1.4rem" }}>{orderNumber}</b>
        </div>

        <div className="button-row" style={{ justifyContent: "center" }}>
          <Link
            href={`/track?order=${encodeURIComponent(orderNumber)}`}
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Track your order
          </Link>
          <Link
            href="/"
            className="btn btn-secondary"
            style={{ textDecoration: "none" }}
          >
            Back to home
          </Link>
        </div>

        <p style={{ fontSize: "0.8rem", marginTop: 24 }}>
          Track your delivery anytime with your order number and the
          phone number you checked out with.
        </p>
      </section>

      <StorefrontFooter />
    </main>
  );
}