import Link from "next/link";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";

export default function NotFound() {
  return (
    <main>
      <StorefrontHeader />

      <section className="state-page">
        <span className="eyebrow">404 · A little lost</span>
        <h1>
          This page has
          <br />
          <em>drifted away.</em>
        </h1>
        <p>
          Like a beautiful scent, some things are hard to hold onto.
          Let’s take you somewhere lovely instead.
        </p>

        <div className="button-row" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Return home
          </Link>
          <Link href="/products" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Explore the shop
          </Link>
        </div>
      </section>
    </main>
  );
}
