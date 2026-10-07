import type { Metadata } from "next";

import { ProductDetailPage } from "features/products";

export const metadata: Metadata = { title: "Product details" };

export default async function ProductDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailPage productId={id} />;
}
