/**
 * Shimmering placeholder shown while client-side data loads, so
 * pages never flash an empty state before the real content arrives.
 */
export default function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`bethel-skeleton ${className}`}
    />
  );
}
