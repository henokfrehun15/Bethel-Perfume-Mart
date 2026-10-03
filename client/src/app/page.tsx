import type { Metadata } from "next";
import Link from "next/link";

import BotanicalBackground from "@/components/BotanicalBackground";
import ProductCard from "@/components/storefront/ProductCard";
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

  return (
    <main className="bethel-page min-h-screen">
      <BotanicalBackground />

      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container flex min-h-[calc(100vh-5rem)] items-center py-20">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#c96a82]">
              Bethel Perfume
            </p>

            <h1 className="font-serif text-5xl leading-[1.05] text-[#30272a] sm:text-6xl md:text-7xl">
              Fragrance that{" "}
              <span className="text-[#c96a82]">
                tells your story.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#756b6e] md:text-lg">
              Discover beautiful fragrances carefully
              selected for unforgettable moments.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#c96a82] px-7 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
              >
                Explore fragrances
              </Link>

              <a
                href="#featured"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#d9c4ca] bg-white/80 px-7 text-sm font-semibold text-[#9e405a] transition hover:bg-[#f7e5e9]"
              >
                Discover the collection
              </a>
            </div>
          </div>
        </section>

        {categoryList.length > 0 && (
          <section className="bethel-container pb-20">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
                Explore
              </p>

              <h2 className="mt-2 font-serif text-3xl text-[#30272a] md:text-4xl">
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
                    className="group rounded-3xl border border-[#eadfe2] bg-white/85 p-6 shadow-[0_10px_35px_rgba(120,70,85,0.05)] transition hover:-translate-y-1 hover:border-[#d9b6c0] hover:bg-white"
                  >
                    <span className="text-xs uppercase tracking-[0.18em] text-[#c96a82]">
                      Collection
                    </span>

                    <h3 className="mt-3 font-serif text-2xl text-[#30272a] group-hover:text-[#9e405a]">
                      {category.name}
                    </h3>

                    <p className="mt-3 text-sm text-[#756b6e]">
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
                Selected for you
              </p>

              <h2 className="mt-2 font-serif text-3xl text-[#30272a] md:text-4xl">
                Featured fragrances
              </h2>
            </div>

            <Link
              href="/products"
              className="hidden text-sm font-semibold text-[#9e405a] hover:underline sm:block"
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
              <p className="font-serif text-2xl text-[#30272a]">
                Our collection is growing.
              </p>

              <Link
                href="/products"
                className="mt-5 inline-flex rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white"
              >
                Browse all fragrances
              </Link>
            </div>
          )}
        </section>

        {promotions.length > 0 && (
          <section className="bg-[#f7e5e9]/55 py-20">
            <div className="bethel-container">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
                  Special selections
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#30272a] md:text-4xl">
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
          <div className="rounded-[2rem] border border-[#eadfe2] bg-white/85 px-6 py-14 text-center shadow-[0_15px_50px_rgba(120,70,85,0.06)] md:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
              Bethel Perfume
            </p>

            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl text-[#30272a] md:text-4xl">
              Find something that becomes part of your story.
            </h2>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-2xl bg-[#c96a82] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
            >
              Explore the collection
            </Link>
          </div>
        </section>

        <footer className="border-t border-[#eadfe2] py-8">
          <div className="bethel-container flex flex-col items-center justify-between gap-3 text-sm text-[#756b6e] sm:flex-row">
            <span className="font-serif text-lg text-[#9e405a]">
              Bethel Perfume
            </span>

            <Link
              href="/products"
              className="hover:text-[#9e405a]"
            >
              Shop fragrances
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
