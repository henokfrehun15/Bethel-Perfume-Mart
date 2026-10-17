import type { Metadata } from "next";
import Link from "next/link";

import ProductCard from "@/components/storefront/ProductCard";
import ProductImage from "@/components/storefront/ProductImage";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import {
  getStorefrontCategories,
  getStorefrontProducts,
  type StorefrontCategory,
  type StorefrontProductSummary,
} from "@/lib/serverApi";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* Arrow icon used by the primary calls to action. */
function Arrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

/*
 * Rendered on the server so search engines and social cards see the
 * featured products, promotions and categories in the initial HTML.
 * The API responses are cached for PRODUCT_REVALIDATE_SECONDS; a
 * failing request degrades to an empty section instead of an error.
 */
export default async function Home() {
  const [featuredResult, promotionsResult, categories] =
    await Promise.all([
      getStorefrontProducts("featured=true&limit=4", {
        revalidate: 300,
      }),
      getStorefrontProducts("promotion=true&limit=4", {
        revalidate: 300,
      }),
      getStorefrontCategories({ revalidate: 300 }),
    ]);

  const featured: StorefrontProductSummary[] =
    featuredResult?.data ?? [];

  const promotions: StorefrontProductSummary[] =
    promotionsResult?.data ?? [];

  const categoryList: StorefrontCategory[] = categories ?? [];

  const heroProduct = featured[0] ?? promotions[0] ?? null;

  const promoProduct = promotions[0] ?? null;

  return (
    <main>
      <StorefrontHeader />

      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Curated in Addis Ababa</span>
          <h1>
            Fragrance that
            <br />
            <em>tells your story.</em>
          </h1>
          <p>
            Discover perfumes and beauty essentials chosen to
            make the everyday feel beautifully yours.
          </p>

          <div className="button-row">
            <Link href="/products" className="btn btn-primary">
              Explore fragrances <Arrow />
            </Link>
            <Link href="/products" className="btn btn-ghost">
              Discover our edit
            </Link>
          </div>

          <div className="hero-notes">
            <span>Authentic products</span>
            <span>Delivery across Addis</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="arch">
            {heroProduct ? (
              <ProductImage
                src={heroProduct.image}
                alt={`${heroProduct.name} perfume bottle`}
                eager
              >
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    padding: 24,
                    textAlign: "center",
                  }}
                >
                  <span className="font-serif text-2xl text-primary">
                    Bethel Perfume
                  </span>
                </div>
              </ProductImage>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span className="font-serif text-2xl text-primary">
                  Bethel Perfume
                </span>
              </div>
            )}
          </div>
          <span className="script-note">find your signature</span>
        </div>
      </section>

      {/* Category strip */}
      {categoryList.length > 0 && (
        <section className="category-strip">
          <span>Shop by mood</span>
          {categoryList.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(
                category.slug
              )}`}
              style={{ textDecoration: "none" }}
            >
              {category.name}
            </Link>
          ))}
        </section>
      )}

      {/* Featured */}
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">The Bethel edit</span>
            <h2>Featured fragrances</h2>
          </div>

          <Link
            href="/products"
            className="text-link"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            View all <Arrow />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="product-grid featured">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 24,
              border: "1px dashed #d9c4ca",
              background: "rgba(255,255,255,0.7)",
              padding: "40px 24px",
              textAlign: "center",
            }}
          >
            <p className="font-serif" style={{ fontSize: "1.6rem" }}>
              Our collection is growing.
            </p>
            <Link
              href="/products"
              className="btn btn-primary"
              style={{ marginTop: 18 }}
            >
              Browse all fragrances
            </Link>
          </div>
        )}
      </section>

      {/* Promotion */}
      {promoProduct && (
        <section className="promotion">
          <div className="promo-image">
            <ProductImage
              src={promoProduct.image}
              alt={`${promoProduct.name} promotional feature`}
            >
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span className="font-serif text-2xl text-primary">
                  Bethel Perfume
                </span>
              </div>
            </ProductImage>
          </div>

          <div className="promo-copy">
            <span className="eyebrow">A little something lovely</span>
            <h2>Beauty in bloom</h2>
            <p>
              Enjoy special pricing on selected fragrances this
              week. A soft invitation to find your next signature.
            </p>
            <Link
              href="/products?promotion=true"
              className="btn btn-primary"
            >
              Shop the promotion <Arrow />
            </Link>
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="closing">
        <span
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: "0.7rem",
            fontWeight: 700,
          }}
        >
          For you, or someone you love.
        </span>
        <h2>
          Make their day
          <br />
          <em>beautifully scented.</em>
        </h2>
        <Link
          href="/products"
          className="btn"
          style={{ background: "white", color: "var(--ink)" }}
        >
          Find a gift
        </Link>
      </section>

      <StorefrontFooter />
    </main>
  );
}
