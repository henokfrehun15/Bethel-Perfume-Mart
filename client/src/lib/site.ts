/**
 * Shared site metadata used by metadata exports, robots.txt and sitemap.xml.
 */

export const SITE_NAME = "Bethel Perfume";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_DESCRIPTION =
  "Discover beautiful fragrances and everyday essentials from Bethel Perfume & Mart. Browse the collection, add to your bag and order online.";
