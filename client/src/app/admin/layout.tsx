"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminSession, getAdminUser } from "@/lib/api";
import Icon from "@/components/admin/Icon";

interface AdminLayoutProps {
  children: ReactNode;
}

/*
 * Figma AdminShell: fixed dark sidebar with Overview / Products /
 * Categories / Orders / Settings, an orders badge, and an admin
 * profile block. Mobile collapses the sidebar into a fixed bottom bar.
 */
const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: "grid", exact: true },
  { label: "Products", href: "/admin/products", icon: "box" },
  { label: "Categories", href: "/admin/categories", icon: "tag" },
  { label: "Orders", href: "/admin/orders", icon: "receipt" },
  { label: "Settings", href: "/admin/settings", icon: "gear" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  const [checkingAuth, setCheckingAuth] = useState(!isLoginPage);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    queueMicrotask(() => {
      // Display hint only — the real session lives in an httpOnly
      // cookie. Expired sessions are caught by the API's 401 handling.
      const user = getAdminUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      setUsername(user.username);

      setCheckingAuth(false);
    });
  }, [isLoginPage, router]);

  const handleLogout = () => {
    // Clears the display hint and asks the API to clear the
    // httpOnly session cookie.
    clearAdminSession();

    router.replace("/admin/login");
  };

  if (checkingAuth && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F7]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#F7E5E9] border-t-[#C96A82]" />

          <p className="text-sm text-[#756B6E]">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="admin">
      {/* Sidebar */}
      <aside className="admin-side">
        <Link href="/admin" className="admin-logo">
          B<span>Bethel</span>
        </Link>

        <nav>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item) ? "active" : ""}
            >
              <Icon name={item.icon} />

              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-profile">
          <span>{username ? username.charAt(0).toUpperCase() : "B"}</span>

          <div>
            <b>Bethel Admin</b>

            <small>{username || "Administrator"}</small>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto p-1 text-[#9d9195] transition-colors hover:text-white"
            aria-label="Log out"
            title="Log out"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">{children}</div>
    </div>
  );
}
