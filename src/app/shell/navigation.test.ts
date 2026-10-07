import { Package } from "react-feather";
import { describe, expect, it } from "vitest";

import {
  isActive,
  navigationItems,
  visibleNavigationItems,
  type NavigationItem,
} from "./navigation";

describe("navigationItems", () => {
  it("every item carries an icon component", () => {
    for (const item of navigationItems) {
      expect(item.icon).toBeDefined();
      // react-feather icons are React.memo objects or function components
      expect(["function", "object"]).toContain(typeof item.icon);
    }
  });

  it("includes dashboard, products, and orders", () => {
    const keys = navigationItems.map((i) => i.key);
    expect(keys).toContain("dashboard");
    expect(keys).toContain("products");
    expect(keys).toContain("orders");
  });
});

describe("visibleNavigationItems", () => {
  const allowAll = () => true;
  const denyAll = () => false;

  it("returns all items when every permission is granted", () => {
    const items = visibleNavigationItems(allowAll);
    expect(items.length).toBe(navigationItems.length);
  });

  it("hides items whose permission is denied", () => {
    const items = visibleNavigationItems(denyAll);
    // Only items without a permission field survive
    const unpermitted = navigationItems.filter((i) => i.permission === undefined);
    expect(items.length).toBe(unpermitted.length);
  });

  it("each visible item keeps its icon", () => {
    const items = visibleNavigationItems(allowAll);
    for (const item of items) {
      expect(item.icon).toBeDefined();
    }
  });
});

describe("isActive", () => {
  const item = (href: string): NavigationItem => ({
    key: "x",
    label: "X",
    href,
    icon: Package,
  });

  const dashboard = item("/");
  const products = item("/products");

  it("matches root only at root", () => {
    expect(isActive(dashboard, "/")).toBe(true);
    expect(isActive(dashboard, "/products")).toBe(false);
  });

  it("matches an item at its own path", () => {
    expect(isActive(products, "/products")).toBe(true);
  });

  it("matches an item on a child path", () => {
    expect(isActive(products, "/products/42")).toBe(true);
  });

  it("does not match a sibling sharing the prefix", () => {
    // A bare `startsWith` selects this, lighting up Products on an unrelated page.
    expect(isActive(products, "/products-archive")).toBe(false);
  });

  it("does not match an unrelated path", () => {
    expect(isActive(products, "/orders")).toBe(false);
  });
});
