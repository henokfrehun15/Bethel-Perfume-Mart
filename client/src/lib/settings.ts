import type { StorefrontSettings } from "./serverApi";

/**
 * Client-side access to the public store settings (contact details,
 * WhatsApp number). The result is cached for the lifetime of the page
 * load, so client-side navigation doesn't refetch on every page.
 * Failures are not cached — the next mount retries.
 */
let cache: StorefrontSettings | null | undefined;

export function fetchPublicSettings(): Promise<StorefrontSettings | null> {
  if (cache !== undefined) {
    return Promise.resolve(cache);
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  return fetch(`${apiUrl}/settings`)
    .then((response) => (response.ok ? response.json() : null))
    .then((payload: { data?: StorefrontSettings } | null) => {
      cache = payload?.data ?? null;

      return cache;
    })
    .catch(() => null);
}
