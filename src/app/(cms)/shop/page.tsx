import type { Metadata } from "next";

import { ShopSettingsForm } from "features/shop";
import PageHeading from "widgets/page-heading";

export const metadata: Metadata = { title: "Shop settings" };

export default function ShopRoute() {
  return (
    <div className="container-fluid p-4">
      <PageHeading heading="Shop settings" />
      <ShopSettingsForm />
    </div>
  );
}
