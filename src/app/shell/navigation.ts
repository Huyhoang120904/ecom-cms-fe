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

import type { ComponentType } from "react";
import { Home, Package, Settings, ShoppingCart, User } from "react-feather";

/** Props that every react-feather icon accepts. */
export interface IconProps {
  size?: string | number;
  color?: string;
  className?: string;
}

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
  /** react-feather icon rendered beside the label. */
  icon: ComponentType<IconProps>;
  /** Group heading rendered in the sidebar. */
  section?: "Shop Management" | "Catalog" | "Shop Settings";
  /** Presentation only: the backend refuses the request regardless of this. */
  permission?: string;
}

export const navigationItems: NavigationItem[] = [
  { key: "dashboard", label: "Home", href: "/", icon: Home, section: "Shop Management", permission: "dashboard:read" },
  { key: "orders", label: "Orders", href: "/orders", icon: ShoppingCart, section: "Shop Management", permission: "orders:read" },
  { key: "products", label: "Products", href: "/products", icon: Package, section: "Catalog", permission: "products:read" },
  { key: "shop", label: "Shop Settings", href: "/shop", icon: Settings, section: "Shop Settings" },
  { key: "profile", label: "Account", href: "/profile", icon: User, section: "Shop Settings" },
];

/**
 * Whether an item is the current location.
 *
 * Root matches exactly. Every other href matches its own path and any child path
 * (`/products/42`), but not a sibling that merely shares the prefix: a bare
 * `startsWith` would light up Products for `/products-archive`.
 */
export function isActive(item: NavigationItem, pathname: string): boolean {
  if (item.href === "/") {
    return pathname === "/";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

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
