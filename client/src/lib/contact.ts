/**
 * Phone number helpers shared by the storefront contact section and
 * footer. Ethiopian numbers arrive in either international
 * (+2519XXXXXXXX) or local (09XXXXXXXX) form; both are displayed and
 * linked consistently.
 */

/** Digits-only form of a phone number. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Human-friendly display form: +251 98 048 8026. */
export function formatPhone(raw: string): string {
  const digits = phoneDigits(raw);

  if (digits.startsWith("251") && digits.length === 12) {
    return `+251 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `0${digits.slice(1, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  return raw;
}

/** `tel:` link that dials the number. */
export function telLink(raw: string): string {
  return `tel:${raw.trim().replace(/\s+/g, "")}`;
}

/** wa.me deep link, or null when the number cannot be normalized. */
export function whatsappLink(raw: string): string | null {
  const digits = phoneDigits(raw);

  if (digits.startsWith("251") && digits.length === 12) {
    return `https://wa.me/${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `https://wa.me/251${digits.slice(1)}`;
  }

  if (digits.length >= 8) {
    return `https://wa.me/${digits}`;
  }

  return null;
}
