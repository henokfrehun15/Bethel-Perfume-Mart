"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCartCount } from "@/lib/cart";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    bag: (
      <>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      width={size}
      height={size}
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

/**
 * Storefront header: centered wordmark, primary nav and a cart button with
 * a live count badge. Mobile collapses the nav behind a menu toggle.
 */
export default function StorefrontHeader() {
  const [cartCount, setCartCount] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const updateCart = () => {
      setCartCount(getCartCount());
    };

    updateCart();

    window.addEventListener("bethel-cart-updated", updateCart);

    return () => {
      window.removeEventListener("bethel-cart-updated", updateCart);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="mobile-menu"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Close menu" : "Open menu"}
        >
          <Icon name={menu ? "close" : "menu"} />
        </button>

        <Link href="/" className="wordmark" style={{ justifySelf: "start" }}>
          Bethel <i>Perfume &amp; Mart</i>
        </Link>

        <nav className={menu ? "nav nav-open" : "nav"}>
          <Link href="/products" onClick={() => setMenu(false)}>
            Shop
          </Link>
          <Link href="/track" onClick={() => setMenu(false)}>
            Track order
          </Link>
        </nav>

        <Link href="/cart" className="cart-button" aria-label="Open cart">
          <Icon name="bag" />
          {cartCount > 0 && <span>{cartCount > 99 ? "99+" : cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}
