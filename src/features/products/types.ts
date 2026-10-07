/**
 * Domain types for the products module.
 *
 * Hand-written from the backend contract — `ecom-be/app/schemas/product/*` and
 * `docs/contracts/API_CONTRACT_CATALOG.md` — because this repository no longer generates
 * types from the served OpenAPI document. Each type names the schema it mirrors, and
 * `./schemas.ts` parses the responses so a moved field fails loudly instead of rendering
 * `undefined`. Prices are integers in the smallest VND unit; this phase has no currency
 * field.
 */

import type { AttributeDataType } from "features/catalog";

/** Mirrors `ProductStatus`. A product is created `draft` and moved by publish/unpublish. */
export type ProductStatus = "draft" | "active" | "inactive";

/** Mirrors `VariantStatus`. */
export type VariantStatus = "active" | "inactive";

/**
 * Mirrors `ProductAttributeData`: one of the product's own attribute values.
 *
 * Which field carries the value depends on `type` — `option_id` for `SELECT`,
 * `value_text` for `TEXT`, `value_number` for `NUMBER`. A variation attribute never
 * appears here: it is an axis of the variants.
 */
export interface ProductAttribute {
  attribute_id: string;
  name: string;
  type: AttributeDataType;
  option_id: string | null;
  option_value: string | null;
  value_text: string | null;
  value_number: number | null;
}

/** Mirrors `ImageData`. `variant_id` is `null` for an image of the product itself. */
export interface ProductImage {
  id: string;
  variant_id: string | null;
  position: number;
  url: string;
}

/** Mirrors `VariantOptionData`: the option a variant picked on one attribute. */
export interface VariantOption {
  attribute_id: string;
  attribute_name: string;
  option_id: string;
  option_value: string;
}

/** Mirrors `VariantData`. A variant's options are fixed at creation. */
export interface Variant {
  id: string;
  product_id: string;
  sku_code: string;
  price: number;
  stock: number;
  status: VariantStatus;
  options: VariantOption[];
  images: ProductImage[];
}

/** Mirrors `ProductSummary`: a list row, with none of the product's children. */
export interface ProductSummary {
  id: string;
  category_id: string;
  brand_id: string | null;
  name: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

/** Mirrors `ProductPage`. */
export interface ProductPage {
  items: ProductSummary[];
  total: number;
  page: number;
  page_size: number;
}

/** Mirrors `ProductData`: a product with everything that hangs off it. */
export interface Product {
  id: string;
  category_id: string;
  brand_id: string | null;
  name: string;
  description: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  attributes: ProductAttribute[];
  variants: Variant[];
  images: ProductImage[];
}

/** Mirrors `AttributeValueRequest`: exactly the field the attribute's type asks for. */
export interface AttributeValuePayload {
  attribute_id: string;
  option_id?: string;
  value_text?: string;
  value_number?: number;
}

/** Mirrors `ProductCreateRequest`. There is no `status`: a product starts `draft`. */
export interface ProductCreatePayload {
  category_id: string;
  brand_id?: string | null;
  name: string;
  description?: string | null;
  attributes: AttributeValuePayload[];
}

/**
 * Mirrors `ProductUpdateRequest`.
 *
 * `status` and `category_id` are not fields, so sending either is a `422`. `attributes`
 * absent leaves the values alone, `[]` clears them, and a list replaces the whole set.
 * `brand_id` and `description` accept an explicit `null` to clear them.
 */
export interface ProductUpdatePayload {
  name?: string;
  description?: string | null;
  brand_id?: string | null;
  attributes?: AttributeValuePayload[];
}

/** Mirrors `VariantOptionRequest`. */
export interface VariantOptionPayload {
  attribute_id: string;
  option_id: string;
}

/** Mirrors `VariantCreateRequest`. */
export interface VariantCreatePayload {
  sku_code: string;
  price: number;
  stock?: number;
  status?: VariantStatus;
  options: VariantOptionPayload[];
}

/** Mirrors `VariantUpdateRequest`. `options` is rejected: delete and recreate instead. */
export interface VariantUpdatePayload {
  sku_code?: string;
  price?: number;
  stock?: number;
  status?: VariantStatus;
}