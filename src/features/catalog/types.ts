/**
 * Domain types for the catalog module.
 *
 * Hand-written from the backend contract — `ecom-be/app/schemas/catalog/*` and
 * `docs/contracts/API_CONTRACT_CATALOG.md` — because this repository no longer
 * generates types from the served OpenAPI document. Each type names the schema it
 * mirrors. The catalog is read-only here: the CMS builds product forms from it and
 * never writes platform configuration.
 */

/** Mirrors `AttributeDataType`. Fixed once an attribute is created. */
export type AttributeDataType = "TEXT" | "NUMBER" | "SELECT";

/** Mirrors `OptionData`: one choice of a `SELECT` attribute. */
export interface AttributeOption {
  id: string;
  value: string;
  sort_order: number;
}

/** Mirrors `CategoryTreeNode`: a category with its children nested. */
export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_leaf: boolean;
  children: CategoryTreeNode[];
}

/**
 * Mirrors `CategoryAttributeData`: one attribute as a category asks for it.
 *
 * `id` is the *attribute's* id — that is what a product's attribute values and a
 * variant's options refer to. `type` is the attribute's `data_type`; `options` is
 * filled for `SELECT` attributes only.
 */
export interface CategoryAttribute {
  id: string;
  key: string;
  name: string;
  type: AttributeDataType;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  is_variation: boolean;
  position: number;
  options: AttributeOption[];
}

/** Mirrors `BrandData`. */
export interface Brand {
  id: string;
  name: string;
  slug: string;
}
