"use client";

import { useState, type ReactNode } from "react";

import { resolveImageUrl } from "@/lib/images";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Load eagerly (above the fold) instead of lazily. */
  eager?: boolean;
  /** Rendered when the image is missing or fails to load. */
  children?: ReactNode;
}

/**
 * Product image with a graceful fallback.
 *
 * Uploads arrive as `/uploads/...` paths and are resolved against the
 * API origin, and a URL that fails to load falls back to `children`
 * instead of the browser's broken-image icon.
 */
export default function ProductImage({
  src,
  alt,
  className,
  eager = false,
  children,
}: ProductImageProps) {
  const resolved = resolveImageUrl(src);

  const [failedSrc, setFailedSrc] = useState<string | null>(
    null
  );

  // Tie the failure to the exact URL, so switching to another
  // gallery image recovers instead of staying on the fallback.
  const failed = resolved !== null && failedSrc === resolved;

  if (!resolved || failed) {
    return <>{children ?? null}</>;
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailedSrc(resolved)}
    />
  );
}
