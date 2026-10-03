const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/**
 * Origin that serves uploaded images (`/uploads/...`).
 */
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/+$/, "");
  }
})();

/**
 * Resolve a product image URL for the browser.
 *
 * Uploaded images are stored as `/uploads/...` paths and are served by
 * the API, not by this Next.js app, so they are prefixed with the API
 * origin. Absolute and inline URLs pass through unchanged.
 */
export function resolveImageUrl(
  url: string | null | undefined
): string | null {
  if (!url) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
