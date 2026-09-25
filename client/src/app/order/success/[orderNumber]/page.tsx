"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

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
          <div className="w-full max-w-2xl rounded-[2rem] border border-[#eadfe2] bg-white/90 px-6 py-12 text-center shadow-[0_20px_60px_rgba(120,70,85,0.08)] md:px-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f7e5e9] text-2xl text-[#9e405a]">
              ✓
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
              Order received
            </p>

            <h1 className="mt-3 font-serif text-4xl leading-tight text-[#30272a] md:text-5xl">
              Thank you for choosing Bethel.
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#756b6e]">
              Your order has been received successfully.
              We will use the contact information you
              provided to follow up about your delivery.
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-[#eadfe2] bg-[#fffcfa] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9093]">
                Order number
              </p>

              <p className="mt-2 break-all font-serif text-2xl text-[#9e405a]">
                {orderNumber}
              </p>

              <div className="mt-4 border-t border-[#eadfe2] pt-4">
                <p className="text-sm leading-6 text-[#756b6e]">
                  Status:{" "}
                  <span className="font-semibold text-[#30272a]">
                    Pending
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
              >
                Continue shopping
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-[#d9c4ca] px-6 py-3 text-sm font-medium text-[#9e405a] transition hover:bg-[#f7e5e9]"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}