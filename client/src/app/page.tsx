import type { Metadata } from "next";
import Link from "next/link";

import ProductCard from "@/components/storefront/ProductCard";
import ProductImage from "@/components/storefront/ProductImage";
import PerfumeIntro from "@/components/storefront/PerfumeIntro";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import {
  getStorefrontCategories,
  getStorefrontProducts,
  getStorefrontSettings,
  type StorefrontCategory,
  type StorefrontProductSummary,
} from "@/lib/serverApi";
import {
  formatPhone,
  telLink,
  whatsappLink,
} from "@/lib/contact";

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

/* Outline icons for the contact cards. */
function ContactIcon({
  name,
}: {
  name: "pin" | "phone" | "chat" | "mail";
}) {
  const paths: Record<string, React.ReactNode> = {
    pin: (
      <>
        <path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
    ),
    chat: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  };

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
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
  const [featuredResult, promotionsResult, categories, settings] =
    await Promise.all([
      getStorefrontProducts("featured=true&limit=4", {
        revalidate: 300,
      }),
      getStorefrontProducts("promotion=true&limit=4", {
        revalidate: 300,
      }),
      getStorefrontCategories({ revalidate: 300 }),
      getStorefrontSettings({ revalidate: 300 }),
    ]);

  const featured: StorefrontProductSummary[] =
    featuredResult?.data ?? [];

  const promotions: StorefrontProductSummary[] =
    promotionsResult?.data ?? [];

  const categoryList: StorefrontCategory[] = categories ?? [];

  const heroProduct = featured[0] ?? promotions[0] ?? null;

  const promoProduct = promotions[0] ?? null;

  /* Contact details come from the admin-editable store settings;
     the address falls back to the physical shop location. */
  const contactAddress =
    settings?.contact_address?.trim() ||
    "Addis Ababa, Bole, Alemnesh Plaza";

  const whatsappNumber = settings?.whatsapp_number?.trim() || "";

  const contactEmail = settings?.contact_email?.trim() || "";

  const phoneDisplay = whatsappNumber
    ? formatPhone(whatsappNumber)
    : "";

  const waHref = whatsappNumber
    ? whatsappLink(whatsappNumber)
    : null;

  return (
    <main>
      {/* Splash intro overlay — plays on every fresh visit; the page
          below stays in the HTML */}
      <PerfumeIntro />

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

      {/* Contact */}
      <section className="section contact">
        <div className="section-head">
          <div>
            <span className="eyebrow">Find us</span>
            <h2>Visit the mart</h2>
          </div>
        </div>

        <div className="contact-grid">
          <article className="contact-card">
            <ContactIcon name="pin" />
            <span>Address</span>
            <b>{contactAddress}</b>
          </article>

          {phoneDisplay && (
            <article className="contact-card">
              <ContactIcon name="phone" />
              <span>Phone</span>
              <b>
                <a href={telLink(whatsappNumber)}>{phoneDisplay}</a>
              </b>
            </article>
          )}

          {waHref && (
            <article className="contact-card">
              <ContactIcon name="chat" />
              <span>WhatsApp</span>
              <b>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat with us
                </a>
              </b>
            </article>
          )}

          {contactEmail && (
            <article className="contact-card">
              <ContactIcon name="mail" />
              <span>Email</span>
              <b>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </b>
            </article>
          )}
        </div>

        <p className="contact-note">
          Orders are confirmed by phone and delivered across Addis
          Ababa — pay cash on delivery.
        </p>
      </section>

      <StorefrontFooter />
    </main>
  );
}
