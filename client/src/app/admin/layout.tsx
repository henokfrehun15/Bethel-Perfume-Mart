"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
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
      const token = localStorage.getItem("admin_token");
      const storedUser = localStorage.getItem("admin_user");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUsername(user.username || "");
        } catch {
          localStorage.removeItem("admin_user");
        }
      }

      setCheckingAuth(false);
    });
  }, [isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");

    router.replace("/admin/login");
  };

  if (checkingAuth && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffcfa]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#f7e5e9] border-t-[#c96a82]" />

          <p className="text-sm text-[#756b6e]">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
    },
    {
      label: "Products",
      href: "/admin/products",
    },
    {
      label: "Categories",
      href: "/admin/categories",
    },
    {
      label: "Settings",
      href: "/admin/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fffcfa] text-[#30272a]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#eadcdf] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7e5e9]">
              <span className="text-xl text-[#c96a82]">
                ✿
              </span>
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#30272a] sm:text-xl">
                Bethel <span className="text-[#c96a82]">Perfume</span>
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#756b6e]">
                Administration
              </p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            {username && (
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7e5e9]">
                  <span className="text-sm font-semibold text-[#9e405a]">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="leading-tight">
                  <p className="text-xs text-[#756b6e]">
                    Signed in as
                  </p>

                  <p className="text-sm font-medium text-[#30272a]">
                    {username}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="rounded-xl border border-[#eadcdf] bg-white px-3 py-2 text-sm font-medium text-[#756b6e] transition hover:border-[#d8aab6] hover:bg-[#fdf3f5] hover:text-[#9e405a]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-[#eadcdf] bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                className={`relative whitespace-nowrap px-4 py-4 text-sm font-medium transition ${
                  isActive
                    ? "text-[#9e405a]"
                    : "text-[#756b6e] hover:text-[#9e405a]"
                }`}
              >
                {item.label}

                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#c96a82]" />
                )}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto min-h-[calc(100vh-130px)] max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {children}
      </main>
    </div>
  );
}