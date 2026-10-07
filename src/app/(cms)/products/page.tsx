import type { Metadata } from "next";

import { ProductsPage } from "features/products";

export const metadata: Metadata = { title: "Products" };

export default function ProductsRoute() {
  return <ProductsPage />;
}
