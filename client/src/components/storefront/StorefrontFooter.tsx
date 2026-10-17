"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  formatPhone,
  telLink,
  whatsappLink,
} from "@/lib/contact";
import { fetchPublicSettings } from "@/lib/settings";
import type { StorefrontSettings } from "@/lib/serverApi";

/** Shown before the settings load and whenever they are missing. */
const FALLBACK_ADDRESS = "Addis Ababa, Bole, Alemnesh Plaza";

/**
 * Storefront footer: dark, two-column layout with the brand wordmark,
 * quick links, contact details from the public store settings, and a
 * legal row. A client component because cart, checkout, tracking and
 * product-detail pages — which are themselves client components —
 * render it directly.
 */
export default function StorefrontFooter() {
  const [settings, setSettings] =
    useState<StorefrontSettings | null>(null);

  useEffect(() => {
    let active = true;

    fetchPublicSettings().then((data) => {
      if (active) {
        setSettings(data);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const address =
    settings?.contact_address?.trim() || FALLBACK_ADDRESS;

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
