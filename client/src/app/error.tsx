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
    <main className="state-page">
      <span className="eyebrow">Something went wrong</span>
      <h1>We could not load this page.</h1>
      <p>
        Please try again. If the problem continues, head back to the
        collection and try later.
      </p>

      <div className="button-row" style={{ justifyContent: "center" }}>
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/products" className="btn btn-secondary" style={{ textDecoration: "none" }}>
          Browse fragrances
        </Link>
      </div>
    </main>
  );
}
