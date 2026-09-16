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

  // Initialize checkingAuth directly using the current route state
  const [checkingAuth, setCheckingAuth] = useState(!isLoginPage);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    // Wrap in a microtask to prevent synchronous setState inside the effect body
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">
              Bethel Perfume
            </h1>

            <p className="text-sm text-gray-500">
              Admin Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">
            {username && (
              <span className="text-sm text-gray-600">
                {username}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl gap-6 px-4">
          <a
            href="/admin"
            className="py-3 text-sm font-medium hover:text-gray-600"
          >
            Dashboard
          </a>

          <a
            href="/admin/products"
            className="py-3 text-sm font-medium hover:text-gray-600"
          >
            Products
          </a>

          <a
            href="/admin/categories"
            className="py-3 text-sm font-medium hover:text-gray-600"
          >
            Categories
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}