/**
 * Mapping helpers for the catalog module.
 *
 * Pure functions only: no I/O, no framework imports.
 */

import type { AttributeDataType, CategoryAttribute, CategoryTreeNode } from "./types";

/** One entry of a category picker, flattened out of the tree. */
export interface CategoryPickOption {
  id: string;
  name: string;
  depth: number;
}

/**
 * Flatten the tree into picker options, deepest-last, in the backend's own order.
 *
 * Only leaves are returned: the contract refuses a product whose category still has
 * children (`422 category_not_leaf`), so offering the branch would offer a dead end.
 * The depth survives so the UI can indent and keep the hierarchy legible.
 */
export function flattenLeafCategories(
  nodes: CategoryTreeNode[],
  depth = 0,
): CategoryPickOption[] {
  const options: CategoryPickOption[] = [];
  for (const node of nodes) {
    if (node.children.length > 0) {
      options.push(...flattenLeafCategories(node.children, depth + 1));
      continue;
    }
    if (node.is_leaf) {
      options.push({ id: node.id, name: node.name, depth });
    }
  }
  return options;
}

/**
 * Split a category's attributes into the two groups a form renders differently.
 *
 * A `is_variation` attribute is an axis of the variant table and must not be entered on
 * the product itself — sending it there is a `422 attribute_is_variation`. Everything
 * else is a plain product value. Both groups keep the backend's `position` order.
 */
export function splitCategoryAttributes(attributes: CategoryAttribute[]): {
  plain: CategoryAttribute[];
  variation: CategoryAttribute[];
} {
  const byPosition = [...attributes].sort((a, b) => a.position - b.position);
  return {
    plain: byPosition.filter((attribute) => !attribute.is_variation),
    variation: byPosition.filter((attribute) => attribute.is_variation),
  };
}

/** Sentence-case label for an attribute's data type, for helper text. */
export function attributeTypeLabel(type: AttributeDataType): string {
  switch (type) {
    case "TEXT":
      return "Text";
    case "NUMBER":
      return "Number";
    case "SELECT":
      return "Choose one";
  }
}

/**
 * Every category's id mapped to its name, branches included.
 *
 * Used to label rows that already reference a category, which may be one that stopped
 * being a leaf after the product was created — the picker only offers leaves, but a stored
 * product can legitimately point at a branch.
 */
export function categoryNameMap(nodes: CategoryTreeNode[]): Map<string, string> {
  const names = new Map<string, string>();
  const walk = (current: CategoryTreeNode[]): void => {
    for (const node of current) {
      names.set(node.id, node.name);
      walk(node.children);
    }
  };
  walk(nodes);
  return names;
}
