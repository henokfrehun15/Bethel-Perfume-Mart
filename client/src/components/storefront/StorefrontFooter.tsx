import Link from "next/link";

/**
 * Storefront footer: brand, shop links and customer-care basics on
 * every storefront page. Content stays factual — cash on delivery
 * and order tracking — with no invented contact details.
 */
export default function StorefrontFooter() {
  return (
    <footer className="border-t border-border bg-white/60">
      <div className="bethel-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-2xl text-primary-dark">
            Bethel Perfume
          </p>

          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            Discover beautiful fragrances carefully
            selected for unforgettable moments.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark">
            Shop
          </p>

          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                href="/products"
                className="text-muted transition hover:text-primary-dark"
              >
                All fragrances
              </Link>
            </li>

            <li>
              <Link
                href="/products?promotion=true"
                className="text-muted transition hover:text-primary-dark"
              >
                Promotions
              </Link>
            </li>

            <li>
              <Link
                href="/cart"
                className="text-muted transition hover:text-primary-dark"
              >
                Your cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-dark">
            Customer care
          </p>

          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                href="/track"
                className="text-muted transition hover:text-primary-dark"
              >
                Track your order
              </Link>
            </li>

            <li className="text-muted">
              Cash on delivery
            </li>

            <li className="text-muted">
              Orders confirmed by phone
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="bethel-container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} Bethel
            Perfume & Mart. All rights reserved.
          </span>

          <span>Cash on delivery · Track every order</span>
        </div>
      </div>
    </footer>
  );
}
