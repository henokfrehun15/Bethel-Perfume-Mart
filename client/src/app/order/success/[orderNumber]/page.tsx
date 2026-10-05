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
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container flex min-h-[70vh] items-center justify-center py-16">
          <div className="w-full max-w-2xl rounded-[2rem] border border-border bg-white/90 px-6 py-12 text-center shadow-[0_20px_60px_rgba(120,70,85,0.08)] md:px-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-2xl text-primary-dark">
              ✓
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
              Order received
            </p>

            <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground md:text-5xl">
              Thank you for choosing Bethel.
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted">
              Your order has been received successfully.
              We will use the contact information you
              provided to follow up about your delivery.
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-light">
                Order number
              </p>

              <p className="mt-2 break-all font-serif text-2xl text-primary-dark">
                {orderNumber}
              </p>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm leading-6 text-muted">
                  Track your delivery anytime with your order number
                  and the phone number you checked out with.
                </p>

                <Link
                  href={`/track?order=${encodeURIComponent(
                    orderNumber
                  )}`}
                  className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Track my order
                </Link>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Continue shopping
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-[#d9c4ca] px-6 py-3 text-sm font-medium text-primary-dark transition hover:bg-primary-light"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

        <StorefrontFooter />
      </div>
    </main>
  );
}