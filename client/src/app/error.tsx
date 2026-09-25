"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unexpected client error:", error);
  }, [error]);

  return (
    <main className="bethel-page flex min-h-screen items-center justify-center px-6 py-16">
      <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-[#eadfe2] bg-white/90 px-6 py-14 text-center shadow-[0_20px_60px_rgba(120,70,85,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
          Something went wrong
        </p>

        <h1 className="mt-3 font-serif text-3xl leading-tight text-[#30272a] md:text-4xl">
          We could not load this page.
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#756b6e]">
          Please try again. If the problem continues, head back to the
          collection and try later.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
          >
            Try again
          </button>

          <Link
            href="/products"
            className="rounded-2xl border border-[#d9c4ca] px-6 py-3 text-sm font-medium text-[#9e405a] transition hover:bg-[#f7e5e9]"
          >
            Browse fragrances
          </Link>
        </div>
      </div>
    </main>
  );
}
