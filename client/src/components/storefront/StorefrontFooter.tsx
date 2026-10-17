import Link from "next/link";

/**
 * Storefront footer: dark, two-column layout with the brand wordmark,
 * quick links and a legal row. Content stays factual — cash on delivery
 * and order tracking — with no invented contact details.
 */
export default function StorefrontFooter() {
  return (
    <footer>
      <div>
        <Link href="/" className="wordmark light" style={{ color: "white" }}>
          Bethel <i>Perfume &amp; Mart</i>
        </Link>
        <p>
          Fragrance, beauty, and small rituals of joy — carefully
          selected for unforgettable moments.
        </p>
      </div>

      <div className="footer-links">
        <Link href="/products">Shop all</Link>
        <Link href="/products?promotion=true">Promotions</Link>
        <Link href="/track">Track order</Link>
        <Link href="/cart">Your cart</Link>
      </div>

      <small>
        © {new Date().getFullYear()} Bethel Perfume &amp; Mart. Cash on
        delivery · Track every order.
      </small>
    </footer>
  );
}

