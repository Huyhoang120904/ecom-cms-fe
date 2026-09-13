/**
 * Seller CMS navigation model.
 *
 * The shell renders this list directly; each href must match a page published
 * under `src/pages`.
 */

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
}

export const navigationItems: NavigationItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "products", label: "Products", href: "/products" },
  { key: "orders", label: "Orders", href: "/orders" },
];
