import { pool } from "../config/database";
import { env } from "../config/env";

// ------------------------------------------------------------
// Store WhatsApp number helpers
// ------------------------------------------------------------

/**
 * Read the store WhatsApp number from the settings table.
 * Falls back to WHATSAPP_NUMBER env var, then null.
 */
export async function getStoreWhatsAppNumber(): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT value FROM settings WHERE key = 'whatsapp_number' LIMIT 1`
    );

    const fromDb = result.rows[0]?.value;

    if (typeof fromDb === "string" && fromDb.trim()) {
      return fromDb.trim();
    }
  } catch (error) {
    console.error("Failed to read WhatsApp number from settings:", error);
  }

  const fromEnv = env.whatsappNumber;

  return typeof fromEnv === "string" && fromEnv.trim()
    ? fromEnv.trim()
    : null;
}

/**
 * Normalize a phone number into the international format WhatsApp
 * expects (digits only, with country code, no plus sign).
 *
 * Examples:
 *   "+251911234567"  -> "251911234567"
 *   "0911234567"     -> "251911234567"  (Ethiopian local format)
 */
export function normalizeWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");

  if (!digits) {
    return null;
  }

  // Already international, strip the plus.
  if (digits.startsWith("+")) {
    const value = digits.slice(1);

    return /^\d{8,15}$/.test(value) ? value : null;
  }

  // Ethiopian local mobile: 09XXXXXXXX or 07XXXXXXXX
  if (/^0[79]\d{8}$/.test(digits)) {
    return `251${digits.slice(1)}`;
  }

  // Local number with country code but no plus: 2519XXXXXXXX
  if (/^251\d{9}$/.test(digits)) {
    return digits;
  }

  // Other generic numbers with country code (8-15 digits).
  if (/^\d{8,15}$/.test(digits)) {
    return digits;
  }

  return null;
}

// ------------------------------------------------------------
// Order message formatting
// ------------------------------------------------------------

interface OrderForMessage {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  customer_notes: string | null;
  currency: string;
  subtotal: string | number;
  delivery_fee: string | number;
  total: string | number;
  items: Array<{
    product_name: string;
    product_size: string | null;
    quantity: number;
    unit_price: string | number;
    subtotal: string | number;
  }>;
}

function formatMoney(value: string | number, currency: string): string {
  return `${currency} ${Number(value).toFixed(2)}`;
}

export function buildNewOrderMessage(order: OrderForMessage): string {
  const lines: string[] = [];

  lines.push("🛍️ *NEW ORDER — Bethel Perfume*");
  lines.push("");
  lines.push(`*Order:* ${order.order_number}`);
  lines.push(
    `*Customer:* ${order.customer_name} (${order.customer_phone})`
  );

  if (order.customer_email) {
    lines.push(`*Email:* ${order.customer_email}`);
  }

  lines.push(`*Delivery to:* ${order.delivery_address}`);

  if (order.customer_notes) {
    lines.push(`*Notes:* ${order.customer_notes}`);
  }

  lines.push("");
  lines.push("*Items:*");

  for (const item of order.items) {
    const size = item.product_size ? ` (${item.product_size})` : "";

    lines.push(
      `• ${item.product_name}${size} — ${item.quantity} × ${formatMoney(
        item.unit_price,
        order.currency
      )} = ${formatMoney(item.subtotal, order.currency)}`
    );
  }

  lines.push("");
  lines.push(`*Subtotal:* ${formatMoney(order.subtotal, order.currency)}`);
  lines.push(`*Delivery:* ${formatMoney(order.delivery_fee, order.currency)}`);
  lines.push(`*TOTAL:* ${formatMoney(order.total, order.currency)}`);

  return lines.join("\n");
}

/**
 * Build a wa.me deep link that opens a WhatsApp chat with the
 * store number, pre-filled with the new-order message.
 */
export function buildWhatsAppLink(
  order: OrderForMessage,
  whatsappNumber: string
): string | null {
  const normalized = normalizeWhatsAppNumber(whatsappNumber);

  if (!normalized) {
    return null;
  }

  const message = buildNewOrderMessage(order);

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

// ------------------------------------------------------------
// Notification delivery
// ------------------------------------------------------------

/**
 * Deliver the new-order notification.
 *
 * Currently logs the clickable wa.me link on the server console.
 * If WHATSAPP_API_URL is configured, the message is also POSTed
 * to that webhook (e.g. a WhatsApp Cloud API bridge) with the
 * order payload — failures never block order creation.
 */
export async function notifyNewOrder(order: OrderForMessage): Promise<void> {
  try {
    const storeNumber = await getStoreWhatsAppNumber();

    if (!storeNumber) {
      console.warn(
        "New order received but no WhatsApp number is configured. " +
          "Set whatsapp_number in store settings or WHATSAPP_NUMBER in .env."
      );

      return;
    }

    const link = buildWhatsAppLink(order, storeNumber);

    if (!link) {
      console.warn(
        `New order received but WhatsApp number "${storeNumber}" could not be normalized.`
      );

      return;
    }

    console.log("\n──────────────────────────────────────");
    console.log("📱 NEW ORDER WhatsApp notification:");
    console.log(link);
    console.log("──────────────────────────────────────");

    const apiUrl = env.whatsappApiUrl;

    if (apiUrl) {
      const message = buildNewOrderMessage(order);

      try {
        await fetch(apiUrl, {
          method: "POST",
          // Never let a slow webhook hang the notification task.
          signal: AbortSignal.timeout(10_000),
          headers: {
            "Content-Type": "application/json",
            ...(env.whatsappApiToken
              ? { Authorization: `Bearer ${env.whatsappApiToken}` }
              : {}),
          },
          body: JSON.stringify({
            to: normalizeWhatsAppNumber(storeNumber),
            message,
            whatsapp_url: link,
            order,
          }),
        });

        console.log("WhatsApp API notification sent.");
      } catch (apiError) {
        console.error("WhatsApp API notification failed:", apiError);
      }
    }
  } catch (error) {
    // Never let notifications break order creation.
    console.error("WhatsApp notification error:", error);
  }
}
