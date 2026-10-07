/**
 * Public exports of the catalog module.
 *
 * The catalog is the read-only platform configuration a product form is built from:
 * the category tree, a category's attribute metadata, and the brand list.
 */

export {
  brandsOptions,
  catalogKeys,
  categoryAttributesOptions,
  categoryTreeOptions,
  useBrandsQuery,
  useCategoryAttributesQuery,
  useCategoryTreeQuery,
} from "./queries";
export {
  attributeTypeLabel,
  categoryNameMap,
  flattenLeafCategories,
  splitCategoryAttributes,
  type CategoryPickOption,
} from "./mapping";
export type {
  AttributeDataType,
  AttributeOption,
  Brand,
  CategoryAttribute,
  CategoryTreeNode,
} from "./types";
