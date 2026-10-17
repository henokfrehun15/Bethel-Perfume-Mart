import Link from "next/link";

import {
  formatPhone,
  telLink,
  whatsappLink,
} from "@/lib/contact";
import { getStorefrontSettings } from "@/lib/serverApi";

/**
 * Storefront footer: dark, two-column layout with the brand wordmark,
 * quick links, contact details from the admin-editable store
 * settings, and a legal row.
 */
export default async function StorefrontFooter() {
  const settings = await getStorefrontSettings({
    revalidate: 300,
  });

  const address =
    settings?.contact_address?.trim() ||
    "Addis Ababa, Bole, Alemnesh Plaza";

  const phone = settings?.whatsapp_number?.trim() || "";

  const email = settings?.contact_email?.trim() || "";

  const waHref = phone ? whatsappLink(phone) : null;

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

        <div className="footer-contact">
          <span>{address}</span>
          {phone && (
            <a href={telLink(phone)}>{formatPhone(phone)}</a>
          )}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp us
            </a>
          )}
          {email && <a href={`mailto:${email}`}>{email}</a>}
        </div>
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
