import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="bethel-page">
      <div className="bethel-container">
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-[#f3dce2] bg-gradient-to-br from-white via-[#fffafa] to-[#f8e7eb] px-6 py-8 shadow-sm sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-light opacity-70" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-primary-light opacity-50" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-dark">
                Product Catalog
              </span>
            </div>

            <h2 className="bethel-title text-3xl sm:text-4xl">
              Add Product
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Add a new fragrance to your Bethel Perfume collection.
            </p>
          </div>
        </div>

        <ProductForm />
      </div>
    </div>
  );
}