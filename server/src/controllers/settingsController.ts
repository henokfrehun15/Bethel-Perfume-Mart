import { Request, Response } from "express";
import { pool } from "../config/database";

const DEFAULT_SETTINGS = {
  store_name: "Bethel Perfume",
  whatsapp_number: "",
  description: "",
  contact_email: "",
  contact_address: "",
  delivery_fee: "0",
};

const SETTING_KEYS = Object.keys(
  DEFAULT_SETTINGS
) as Array<keyof typeof DEFAULT_SETTINGS>;

export const getSettings = async (
  _req: Request,
  res: Response
) => {
  try {
    const result = await pool.query(
      `
      SELECT key, value
      FROM settings
      WHERE key = ANY($1::text[])
      ORDER BY key ASC
      `,
      [SETTING_KEYS]
    );

    const settings = {
      ...DEFAULT_SETTINGS,
    };

    for (const row of result.rows) {
      if (
        Object.prototype.hasOwnProperty.call(
          settings,
          row.key
        )
      ) {
        settings[
          row.key as keyof typeof DEFAULT_SETTINGS
        ] = row.value;
      }
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error(
      "Get settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
};

export const updateSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      store_name,
      whatsapp_number,
      description,
      contact_email,
      contact_address,
      delivery_fee,
    } = req.body;

    const values = {
      store_name,
      whatsapp_number,
      description,
      contact_email,
      contact_address,
      delivery_fee,
    };

    if (
      typeof store_name !== "undefined" &&
      typeof store_name !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "store_name must be a string",
      });
    }

    if (
      typeof whatsapp_number !== "undefined" &&
      typeof whatsapp_number !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "whatsapp_number must be a string",
      });
    }

    if (
      typeof description !== "undefined" &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "description must be a string",
      });
    }

    if (
      typeof contact_email !== "undefined" &&
      typeof contact_email !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "contact_email must be a string",
      });
    }

    if (
      typeof contact_address !== "undefined" &&
      typeof contact_address !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "contact_address must be a string",
      });
    }

    if (
      typeof store_name === "string" &&
      store_name.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Store name cannot be empty",
      });
    }

    // The delivery fee is stored as text but must be a non-negative number.
    if (typeof delivery_fee !== "undefined") {
      const parsedFee = Number.parseFloat(delivery_fee);

      if (
        typeof delivery_fee !== "string" ||
        !Number.isFinite(parsedFee) ||
        parsedFee < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "delivery_fee must be a non-negative number",
        });
      }
    }

    for (const key of SETTING_KEYS) {
      const value = values[key];

      if (typeof value === "undefined") {
        continue;
      }

      await pool.query(
        `
        INSERT INTO settings (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key)
        DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
        `,
        [key, value]
      );
    }

    const result = await pool.query(
      `
      SELECT key, value
      FROM settings
      WHERE key = ANY($1::text[])
      ORDER BY key ASC
      `,
      [SETTING_KEYS]
    );

    const settings = {
      ...DEFAULT_SETTINGS,
    };

    for (const row of result.rows) {
      if (
        Object.prototype.hasOwnProperty.call(
          settings,
          row.key
        )
      ) {
        settings[
          row.key as keyof typeof DEFAULT_SETTINGS
        ] = row.value;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error(
      "Update settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};