"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import Icon from "@/components/admin/Icon";
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

/* Figma AdminHeader: eyebrow + serif title, notification bell + action. */
function AdminHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-head">
      <div>
        <span>{eyebrow}</span>

        <h1>{title}</h1>
      </div>

      <div className="admin-head-actions">
        <button className="notification" aria-label="Notifications">
          ○<i />
        </button>

        {action}
      </div>
    </div>
  );
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

      const response = await apiRequest<CategoriesResponse>("/categories");

      setCategories(response.data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load categories"
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
        await apiRequest<CategoryResponse>(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });

        setSuccess("Category updated successfully.");
      } else {
        await apiRequest<CategoryResponse>("/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });

        setSuccess("Category created successfully.");
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save category"
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

      await apiRequest(`/categories/${id}`, {
        method: "DELETE",
      });

      setSuccess("Category deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadCategories();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    }
  };

  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <AdminHeader
        eyebrow="Catalog"
        title="Categories"
        action={
          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: "0.7rem 1.2rem",
              fontSize: "0.78rem",
            }}
            onClick={scrollTop}
          >
            + New category
          </button>
        }
      />

      {error && (
        <div className="bethel-alert bethel-alert-error mb-4">{error}</div>
      )}

      {success && (
        <div className="bethel-alert bethel-alert-success mb-4">{success}</div>
      )}

      {/* Form card, mirroring the Figma admin-card pattern */}
      <section
        className="admin-card"
        style={{ padding: "0 22px 6px", marginBottom: 22 }}
      >
        <div className="card-head">
          <div>
            <h3>{editingId ? "Edit category" : "New category"}</h3>

            <p>
              {editingId
                ? "Update the selected fragrance collection."
                : "Add a new fragrance collection to your store."}
            </p>
          </div>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pb-5">
          <div className="form-grid">
            <label className="field">
              <span>Category name *</span>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="e.g. Floral perfumes"
              />
            </label>

            <label className="field">
              <span>Slug *</span>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  required
                  placeholder="floral-perfumes"
                />

                <button
                  type="button"
                  onClick={generateSlug}
                  className="btn btn-secondary"
                  style={{ padding: "0.6rem 1rem", fontSize: "0.7rem" }}
                >
                  Generate
                </button>
              </div>
            </label>
          </div>

          <label className="field">
            <span>Description</span>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Describe this fragrance collection..."
            />
          </label>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update category"
                  : "Save category"}
            </button>
          </div>
        </form>
      </section>

      {/* Categories grid, mirroring the Figma category-admin cards */}
      {loading ? (
        <div className="category-admin">
          {[0, 1, 2, 3].map((card) => (
            <Skeleton key={card} className="h-20 rounded-[15px]" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="table-wrap py-16 text-center">
          <p className="text-sm text-[#756B6E]">
            No categories yet. Create your first fragrance collection with the
            form above.
          </p>
        </div>
      ) : (
        <div className="category-admin">
          {categories.map((category) => (
            <article key={category.id}>
              <span className="category-icon">
                <Icon name="tag" />
              </span>

              <div>
                <h3>{category.name}</h3>

                <p>{category.description || `/${category.slug}`}</p>
              </div>

              <span className="badge badge-green">Active</span>

              <button
                type="button"
                onClick={() => handleEdit(category)}
                aria-label={`Edit ${category.name}`}
                title="Edit"
              >
                <Icon name="edit" size={16} />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(category.id)}
                aria-label={`Delete ${category.name}`}
                title="Delete"
                style={{ color: "#B94A5C" }}
              >
                <Icon name="trash" size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
