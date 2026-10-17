"use client";

import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <div className="admin-head">
        <div>
          <span>Catalog</span>

          <h1>Add product</h1>
        </div>
      </div>

      <ProductForm />
    </>
  );
}
