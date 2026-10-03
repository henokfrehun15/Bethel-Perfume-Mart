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

  return (
    <div className="mt-10 rounded-3xl border border-[#eadfe2] bg-white/90 p-4 shadow-[0_12px_40px_rgba(120,70,85,0.06)] backdrop-blur-sm md:p-5">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 md:flex-row"
      >
        <input
          type="search"
          name="search"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(event.target.value)
          }
          placeholder="Search fragrances..."
          className="min-h-12 flex-1 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a] outline-none transition placeholder:text-[#9b9093] focus:border-[#c96a82] focus:ring-2 focus:ring-[#c96a82]/10"
        />

        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-[#c96a82] px-7 text-sm font-semibold text-white transition hover:bg-[#9e405a]"
        >
          Search
        </button>
      </form>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={category}
          onChange={(event) =>
            apply({ category: event.target.value })
          }
          className="min-h-11 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a] outline-none focus:border-[#c96a82]"
        >
          <option value="">
            All categories
          </option>

          {categories.map((item) => (
            <option
              key={item.id}
              value={item.slug}
            >
              {item.name}
            </option>
          ))}
        </select>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a]">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) =>
              apply({ inStock: event.target.checked })
            }
            className="h-4 w-4 accent-[#c96a82]"
          />

          In stock only
        </label>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-[#dfd3d7] bg-[#fffcfa] px-4 text-sm text-[#30272a]">
          <input
            type="checkbox"
            checked={promotion}
            onChange={(event) =>
              apply({ promotion: event.target.checked })
            }
            className="h-4 w-4 accent-[#c96a82]"
          />

          Promotions
        </label>

        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="min-h-11 rounded-2xl border border-[#d9c4ca] px-4 text-sm font-medium text-[#9e405a] transition hover:bg-[#f7e5e9]"
          >
            Clear filters
          </button>
        ) : (
          <div className="hidden lg:block" />
        )}
      </div>
    </div>
  );
}
