"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { StorefrontCategory } from "@/lib/serverApi";

interface ProductFiltersProps {
  categories: StorefrontCategory[];
  search: string;
  category: string;
  inStock: boolean;
  promotion: boolean;
}

/**
 * Filter controls for the server-rendered catalogue.
 *
 * The product grid is rendered on the server (SEO); this component
 * only turns filter changes into URL updates, so every state is
 * shareable, crawlable and back-button friendly. Changing a filter
 * always returns to the first page.
 */
export default function ProductFilters({
  categories,
  search,
  category,
  inStock,
  promotion,
}: ProductFiltersProps) {
  const router = useRouter();

  const [searchInput, setSearchInput] =
    useState(search);

  const apply = (
    changes: Partial<{
      search: string;
      category: string;
      inStock: boolean;
      promotion: boolean;
    }>
  ) => {
    const next = {
      search,
      category,
      inStock,
      promotion,
      ...changes,
    };

    const params = new URLSearchParams();

    if (next.search.trim()) {
      params.set("search", next.search.trim());
    }

    if (next.category) {
      params.set("category", next.category);
    }

    if (next.inStock) {
      params.set("inStock", "true");
    }

    if (next.promotion) {
      params.set("promotion", "true");
    }

    const query = params.toString();

    router.push(query ? `/products?${query}` : "/products");
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    apply({ search: searchInput });
  };

  const hasFilters =
    search || category || inStock || promotion;

  const chips: { label: string; active: boolean; toggle: () => void }[] = [
    { label: "All", active: !category && !inStock && !promotion, toggle: () => router.push(search ? `/products?search=${encodeURIComponent(search)}` : "/products") },
    { label: "On promotion", active: promotion, toggle: () => apply({ promotion: !promotion }) },
    { label: "In stock", active: inStock, toggle: () => apply({ inStock: !inStock }) },
  ];

  return (
    <div>
      <div className="toolbar">
        <form onSubmit={handleSearch} className="search" style={{ margin: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            name="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search fragrances and beauty..."
          />
        </form>

        <div className="filters">
          {chips.map((chip) => (
            <button
              type="button"
              key={chip.label}
              className={chip.active ? "active" : ""}
              onClick={chip.toggle}
            >
              {chip.label}
            </button>
          ))}

          <select
            value={category}
            onChange={(event) => apply({ category: event.target.value })}
            aria-label="Filter by category"
            style={{
              padding: "0.75rem 1.1rem",
              border: "1px solid var(--border)",
              borderRadius: 999,
              background: "white",
              fontSize: "0.78rem",
            }}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => router.push("/products")}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
