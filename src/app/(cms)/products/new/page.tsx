import type { Metadata } from "next";

import { ProductFormPage } from "features/products";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductRoute() {
  return <ProductFormPage mode="create" />;
}