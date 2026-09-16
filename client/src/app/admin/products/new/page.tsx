import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">
          Add Product
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add a new product to your catalog.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}