"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
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
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Categories
        </h2>

        <p className="mt-1 text-gray-500">
          Create and manage product categories.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Category form */}
      <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {editingId
                ? "Edit category"
                : "Create category"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {editingId
                ? "Update the selected category."
                : "Add a new category to your store."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Category name *
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                placeholder="Men's Perfume"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Slug *
              </label>

              <div className="flex gap-2">
                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
                  placeholder="mens-perfume"
                />

                <button
                  type="button"
                  onClick={generateSlug}
                  className="whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
              placeholder="Describe this category..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update category"
                : "Create category"}
          </button>
        </form>
      </section>

      {/* Categories list */}
      <section className="rounded-xl bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h3 className="text-lg font-semibold">
            All categories
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No categories found.
          </div>
        ) : (
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h4 className="font-semibold">
                    {category.name}
                  </h4>

                  <p className="mt-1 text-sm text-gray-500">
                    /{category.slug}
                  </p>

                  {category.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(category)
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(category.id)
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
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
  );
}