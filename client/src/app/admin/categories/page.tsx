"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import { apiRequest } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  created_at?: string;
  updated_at?: string;
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  data: Category[];
}

interface CategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest<CategoriesResponse>(
        "/categories"
      );

      setCategories(response.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadCategories();
    });
  }, [loadCategories]);

  const generateSlug = () => {
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlug(generated);
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
      };

      if (!body.name || !body.slug) {
        throw new Error("Name and slug are required");
      }

      if (editingId) {
        await apiRequest<CategoryResponse>(
          `/categories/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          }
        );

        setSuccess("Category updated successfully.");
      } else {
        await apiRequest<CategoryResponse>(
          "/categories",
          {
            method: "POST",
            body: JSON.stringify(body),
          }
        );

        setSuccess("Category created successfully.");
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save category"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(
        `/categories/${id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess("Category deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadCategories();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete category"
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary-light opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-96 h-72 w-72 rounded-full bg-[#fdf3f5] blur-3xl" />

      <div className="relative">
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg text-primary">✿</span>

            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-dark">
              Fragrance Collections
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Categories
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Create and organize the fragrance collections
                available throughout your store.
              </p>
            </div>

            <div className="flex h-10 items-center rounded-full bg-primary-light px-4 text-sm font-medium text-primary-dark">
              {categories.length}{" "}
              {categories.length === 1
                ? "category"
                : "categories"}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bethel-alert bethel-alert-error mb-6 flex items-start gap-3">
            <span className="mt-0.5">!</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bethel-alert bethel-alert-success mb-6 flex items-start gap-3">
            <span className="mt-0.5">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form Card */}
        <section className="bethel-card bethel-floral mb-8 overflow-hidden">
          <div className="border-b border-[#eadcdf] px-6 py-6 sm:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light">
                    <span className="text-primary">
                      {editingId ? "✎" : "+"}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground">
                    {editingId
                      ? "Edit category"
                      : "Create category"}
                  </h3>
                </div>

                <p className="mt-2 text-sm text-muted">
                  {editingId
                    ? "Update the selected fragrance collection."
                    : "Add a new fragrance collection to your store."}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bethel-button bethel-button-secondary"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-6 sm:px-8"
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* Name */}
              <div>
                <label className="bethel-label">
                  Category name *
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  className="bethel-input"
                  placeholder="Men's Perfume"
                />

                <p className="mt-2 text-xs text-[#9a8f92]">
                  The name customers will see.
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="bethel-label">
                  Slug *
                </label>

                <div className="flex gap-2">
                  <input
                    value={slug}
                    onChange={(event) =>
                      setSlug(event.target.value)
                    }
                    required
                    className="bethel-input"
                    placeholder="mens-perfume"
                  />

                  <button
                    type="button"
                    onClick={generateSlug}
                    className="bethel-button bethel-button-secondary shrink-0"
                  >
                    Generate
                  </button>
                </div>

                <p className="mt-2 text-xs text-[#9a8f92]">
                  Used in the category URL.
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="bethel-label">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
                className="bethel-input resize-none"
                placeholder="Describe this fragrance collection..."
              />

              <p className="mt-2 text-xs text-[#9a8f92]">
                Optional description for this collection.
              </p>
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#f0e3e6] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#9a8f92]">
                Fields marked with * are required.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="bethel-button bethel-button-primary min-w-[160px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update category"
                    : "Create category"}
              </button>
            </div>
          </form>
        </section>

        {/* Categories List */}
        <section className="bethel-card overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-[#eadcdf] px-6 py-6 sm:flex-row sm:items-center sm:px-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                All categories
              </h3>

              <p className="mt-1 text-sm text-muted">
                Your current fragrance collections.
              </p>
            </div>

            <span className="bethel-badge bethel-badge-pink">
              {categories.length} total
            </span>
          </div>

          {loading ? (
            <div className="grid gap-3 px-6 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((card) => (
                <Skeleton
                  key={card}
                  className="h-24 rounded-2xl"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-16 text-center sm:px-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdf3f5]">
                <span className="text-2xl text-primary">
                  ✿
                </span>
              </div>

              <h4 className="text-base font-semibold text-foreground">
                No categories yet
              </h4>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Create your first fragrance collection using
                the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0e3e6]">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="group flex flex-col gap-5 px-6 py-6 transition hover:bg-[#fdf9fa] sm:px-8 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    {/* Number */}
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdf3f5] text-sm font-semibold text-primary sm:flex">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground">
                          {category.name}
                        </h4>

                        <span className="bethel-badge bethel-badge-pink">
                          Active
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-primary">
                        /{category.slug}
                      </p>

                      {category.description && (
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(category)
                      }
                      className="bethel-button bethel-button-secondary"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(category.id)
                      }
                      className="bethel-button border border-[#edcbd1] bg-white text-[#b94a5c] hover:bg-[#fdf0f2]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}