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

  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container grid min-h-[calc(100vh-5rem)] items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-primary-dark">
              Bethel Perfume
            </p>

            <h1 className="font-serif text-5xl leading-[1.05] text-foreground sm:text-6xl md:text-7xl">
              Fragrance that{" "}
              <span className="text-primary">
                tells your story.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-muted md:text-lg">
              Discover beautiful fragrances carefully
              selected for unforgettable moments.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-7 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Explore fragrances
              </Link>

              <a
                href="#featured"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#d9c4ca] bg-white/80 px-7 text-sm font-semibold text-primary-dark transition hover:bg-primary-light"
              >
                Discover the collection
              </a>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-primary/25" />

            <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-primary-light/70 blur-2xl" />

            {heroProduct ? (
              <Link
                href={`/products/${heroProduct.slug}`}
                className="group block overflow-hidden rounded-[2.5rem] border border-border bg-[#f9f0f2] shadow-[0_25px_70px_rgba(120,70,85,0.14)]"
              >
                <ProductImage
                  src={heroProduct.image}
                  alt={heroProduct.name}
                  className="aspect-[4/5] h-full w-full object-cover transition duration-500 group-hover:scale-105"
                >
                  <div className="flex aspect-[4/5] items-center justify-center px-8 text-center">
                    <span className="font-serif text-3xl text-primary">
                      Bethel Perfume
                    </span>
                  </div>
                </ProductImage>
              </Link>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[2.5rem] border border-border bg-white/70 px-8 text-center">
                <span className="font-serif text-3xl text-primary">
                  Bethel Perfume
                </span>
              </div>
            )}

            <div className="absolute -bottom-5 left-6 rounded-2xl border border-border bg-white/95 px-5 py-3.5 shadow-[0_12px_35px_rgba(120,70,85,0.12)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-dark">
                {heroProduct ? "Featured" : "The collection"}
              </p>

              <p className="mt-0.5 font-serif text-lg text-foreground">
                {heroProduct?.name ?? "Coming soon"}
              </p>
            </div>
          </div>
        </section>

        {categoryList.length > 0 && (
          <section className="bethel-container pb-20">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
                Explore
              </p>

              <h2 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
                Shop by category
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categoryList.slice(0, 4).map(
                (category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${encodeURIComponent(
                      category.slug
                    )}`}
                    className="group rounded-3xl border border-border bg-white/85 p-6 shadow-[0_10px_35px_rgba(120,70,85,0.05)] transition hover:-translate-y-1 hover:border-[#d9b6c0] hover:bg-white"
                  >
                    <span className="text-xs uppercase tracking-[0.18em] text-primary-dark">
                      Collection
                    </span>

                    <h3 className="mt-3 font-serif text-2xl text-foreground group-hover:text-primary-dark">
                      {category.name}
                    </h3>

                    <p className="mt-3 text-sm text-muted">
                      Explore fragrances
                    </p>
                  </Link>
                )
              )}
            </div>
          </section>
        )}

        <section
          id="featured"
          className="bethel-container pb-20"
        >
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
                Selected for you
              </p>

              <h2 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
                Featured fragrances
              </h2>
            </div>

            <Link
              href="/products"
              className="hidden text-sm font-semibold text-primary-dark hover:underline sm:block"
            >
              View all
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#d9c4ca] bg-white/70 p-10 text-center">
              <p className="font-serif text-2xl text-foreground">
                Our collection is growing.
              </p>

              <Link
                href="/products"
                className="mt-5 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white"
              >
                Browse all fragrances
              </Link>
            </div>
          )}
        </section>

        {promotions.length > 0 && (
          <section className="bg-primary-light/55 py-20">
            <div className="bethel-container">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
                  Special selections
                </p>

                <h2 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
                  Current promotions
                </h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {promotions.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bethel-container py-20">
          <div className="rounded-[2rem] border border-border bg-white/85 px-6 py-14 text-center shadow-[0_15px_50px_rgba(120,70,85,0.06)] md:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
              Bethel Perfume
            </p>

            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl text-foreground md:text-4xl">
              Find something that becomes part of your story.
            </h2>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-2xl bg-primary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Explore the collection
            </Link>
          </div>
        </section>

        <StorefrontFooter />
      </div>
    </main>
  );
}
