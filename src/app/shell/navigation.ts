/**
 * Seller CMS navigation model.
 *
 * The shell renders this list directly; each href must match a page published under
 * `src/pages`.
 *
 * `permission` is presentation only: it keeps the shell from offering a link whose
 * page would immediately fail, and it is never an authorization decision. The
 * backend refuses the request regardless of what is rendered here.
 */

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
  /** Presentation only: the backend refuses the request regardless of this. */
  permission?: string;
}

export const navigationItems: NavigationItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", permission: "dashboard:read" },
  { key: "products", label: "Products", href: "/products", permission: "products:read" },
  { key: "orders", label: "Orders", href: "/orders", permission: "orders:read" },
];

/**
 * The items an account should be offered.
 *
 * An item with no permission is always shown. An item whose permission is absent is
 * hidden rather than shown disabled, because a link the seller can never use adds
 * nothing to the page.
 */
export function visibleNavigationItems(can: (permission: string) => boolean): NavigationItem[] {
  return navigationItems.filter((item) => item.permission === undefined || can(item.permission));
}
