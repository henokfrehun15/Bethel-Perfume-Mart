import { pool } from "../config/database";

/** Delivery fee used when the merchant has not configured one. */
export const DEFAULT_DELIVERY_FEE = 0;

/**
 * Read the store delivery fee from the settings table.
 *
 * The value is stored as text (settings.value is TEXT) and managed from the
 * admin dashboard. Anything missing or invalid falls back to
 * DEFAULT_DELIVERY_FEE so ordering never breaks because of bad settings.
 */
export async function getDeliveryFee(): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT value FROM settings WHERE key = 'delivery_fee' LIMIT 1`
    );

    const fee = Number.parseFloat(result.rows[0]?.value);

    if (Number.isFinite(fee) && fee >= 0) {
      return fee;
    }
  } catch (error) {
    console.error(
      "Failed to read the delivery fee from settings:",
      error
    );
  }

  return DEFAULT_DELIVERY_FEE;
}
