import { Request, Response } from "express";
import { pool } from "../config/database";

// GET all categories
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM categories ORDER BY name ASC`
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// GET single category
export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT * FROM categories WHERE slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};

// CREATE category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, parent_id } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO categories (name, slug, description, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        name, 
        slug, 
        description ?? null, // Uses null if undefined
        parent_id ?? null    // Uses null if undefined
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Create category error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Category slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// UPDATE category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parent_id } = req.body;

    const result = await pool.query(
      `
      UPDATE categories
      SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = CASE WHEN $3 = 'UNSET' THEN NULL ELSE COALESCE($4, description) END,
        parent_id = CASE WHEN $5 = 'UNSET' THEN NULL ELSE COALESCE($6, parent_id) END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        name ?? null,
        slug ?? null,
        description === null ? 'UNSET' : null, // Flag to unset
        description ?? null,
        parent_id === null ? 'UNSET' : null,   // Flag to unset
        parent_id ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("Update category error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Category slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// DELETE category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM categories
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete category error:", error);

    // 23503 = foreign key violation; 23001 = RESTRICT violation —
    // the category still contains products.
    if (error.code === "23503" || error.code === "23001") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category because it contains products",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};
