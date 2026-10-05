/**
 * Skeleton shown while the server renders a filtered catalogue view.
 *
 * NOTE: the sibling [slug] route deliberately has no loading.tsx —
 * there, a loading boundary swallows the 404 status of notFound()
 * (vercel/next.js#93253). This route never calls notFound(), so the
 * boundary is safe.
 */
export default function ProductsLoading() {
  return (
    <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-border bg-white"
        >
          <div className="aspect-[4/5] animate-pulse bg-primary-light" />

          <div className="space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-primary-light" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-primary-light" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-primary-light" />
          </div>
        </div>
      ))}
    </div>
  );
}
