import Link from "next/link";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";

export default function NotFound() {
  return (
    <main className="bethel-page min-h-screen">
      <div className="relative z-10">
        <StorefrontHeader />

        <section className="bethel-container flex min-h-[70vh] items-center justify-center py-16">
          <div className="max-w-xl rounded-[2rem] border border-[#eadfe2] bg-white/90 px-6 py-14 text-center shadow-[0_20px_60px_rgba(120,70,85,0.08)] md:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c96a82]">
              404
            </p>

            <h1 className="mt-3 font-serif text-4xl leading-tight text-[#30272a] md:text-5xl">
              This page has wandered off.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[#756b6e]">
              The page you are looking for does not exist or has been
              moved. Explore the collection to find your next
              fragrance.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="rounded-2xl bg-[#c96a82] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
              >
                Browse fragrances
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
