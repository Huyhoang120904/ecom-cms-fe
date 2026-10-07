import type { Metadata } from "next";

import { ProductFormPage } from "features/products";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductFormPage mode="edit" productId={id} />;
}