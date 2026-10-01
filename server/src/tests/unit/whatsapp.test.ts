import { describe, expect, it } from "vitest";

import {
  buildNewOrderMessage,
  buildWhatsAppLink,
  normalizeWhatsAppNumber,
} from "../../services/whatsappService";

const order = {
  order_number: "BETHEL-20260101-000001",
  customer_name: "Henok",
  customer_phone: "0912345678",
  customer_email: null,
  delivery_address: "Addis Ababa",
  customer_notes: null,
  currency: "ETB",
  subtotal: 1800,
  delivery_fee: 100,
  total: 1900,
  items: [
    {
      product_name: "Amber Perfume",
      product_size: "50ml",
      quantity: 2,
      unit_price: 900,
      subtotal: 1800,
    },
  ],
};

describe("normalizeWhatsAppNumber", () => {
  it("strips the plus from international numbers", () => {
    expect(normalizeWhatsAppNumber("+251911234567")).toBe(
      "251911234567"
    );
  });

  it("converts Ethiopian local mobile numbers", () => {
    expect(normalizeWhatsAppNumber("0911234567")).toBe(
      "251911234567"
    );

    expect(normalizeWhatsAppNumber("0711234567")).toBe(
      "251711234567"
    );
  });

  it("accepts numbers already in country-code form", () => {
    expect(normalizeWhatsAppNumber("251911234567")).toBe(
      "251911234567"
    );
  });

  it("returns null for unusable input", () => {
    expect(normalizeWhatsAppNumber("")).toBeNull();
    expect(normalizeWhatsAppNumber("abc")).toBeNull();
    expect(normalizeWhatsAppNumber("123")).toBeNull();
  });
});

describe("buildNewOrderMessage", () => {
  it("includes the order number, customer and totals", () => {
    const message = buildNewOrderMessage(order);

    expect(message).toContain(order.order_number);
    expect(message).toContain("Henok");
    expect(message).toContain("0912345678");
    expect(message).toContain("Addis Ababa");
    expect(message).toContain(
      "Amber Perfume (50ml) — 2 × ETB 900.00 = ETB 1800.00"
    );
    expect(message).toContain("*Subtotal:* ETB 1800.00");
    expect(message).toContain("*Delivery:* ETB 100.00");
    expect(message).toContain("*TOTAL:* ETB 1900.00");
  });

  it("omits optional lines that have no value", () => {
    const message = buildNewOrderMessage(order);

    expect(message).not.toContain("*Email:*");
    expect(message).not.toContain("*Notes:*");
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me deep link with the encoded message", () => {
    const link = buildWhatsAppLink(order, "+251911234567");

    expect(link).not.toBeNull();
    expect(link!.startsWith("https://wa.me/251911234567?text=")).toBe(
      true
    );
    expect(decodeURIComponent(link!.split("text=")[1])).toContain(
      order.order_number
    );
  });

  it("returns null when the number cannot be normalized", () => {
    expect(buildWhatsAppLink(order, "not-a-number")).toBeNull();
  });
});
