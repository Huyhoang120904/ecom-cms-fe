/**
 * Mapping helpers for the products module.
 *
 * Pure functions only: no I/O, no framework imports. Everything here is about the two
 * conversions the module turns on — form state to request payload (where *absent* and
 * *null* mean different things to the backend), and the contract's flat product into the
 * shapes components render.
 */

import type { CategoryAttribute } from "features/catalog";

import {
  PRODUCT_IMAGES_MAX,
  VARIANT_IMAGES_MAX,
  VARIANT_OPTIONS_MAX,
} from "./constants";
import {
  attributeValueIsEmpty,
  type AttributeValueInput,
  type AttributeValuesById,
  type ProductFilters,
  type ProductFormValues,
} from "./schemas";
import type {
  AttributeValuePayload,
  Product,
  ProductAttribute,
  ProductCreatePayload,
  ProductImage,
  ProductStatus,
  ProductUpdatePayload,
  VariantCreatePayload,
  VariantOptionPayload,
  VariantStatus,
} from "./types";

/** One row of the variant matrix: a combination of the category's variation options. */
export interface VariantMatrixRow {
  /** Stable key for React, and for tracking edited values before the variant exists. */
  key: string;
  /** `attribute_id`/`option_id` pairs, in the order the axes are rendered. */
  options: VariantOptionPayload[];
  /** The option labels, for the row's description and the SKU suggestion. */
  optionLabels: string[];
}

// ---------------------------------------------------------------------------
// Filters and formatting
// ---------------------------------------------------------------------------

/** Convert validated filters into request query parameters. */
export function listParamsFromFilters(filters: ProductFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("page_size", String(filters.pageSize));
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}

/**
 * Format an integer amount of the smallest VND unit.
 *
 * `vi-VN` + `VND` renders `1.234.567 ₫` with no fraction digits, which is how the price is
 * actually stored: a whole number of đồng. Nothing here invents a currency the contract
 * does not have.
 */
export function formatVnd(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

/** Format an ISO timestamp as a short date, or a dash when absent. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/** Human label for a product status. */
export function productStatusLabel(status: ProductStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
  }
}

/** Human label for a variant status. */
export function variantStatusLabel(status: VariantStatus): string {
  return status === "active" ? "Active" : "Inactive";
}

/**
 * The "can this be sold right now" answer, from the loaded data alone.
 *
 * The backend is the authority (`services/product_rules.py`); this only decides which
 * sentence the detail page shows before the seller tries, and it describes what the
 * backend requires rather than claiming to know its verdict.
 */
export function sellableSummary(product: Product): string {
  if (product.status !== "active") {
    return "Not on sale: only an active product is sold.";
  }
  if (product.variants.length === 0) {
    return "Not on sale: an active product needs at least one variant.";
  }
  if (!product.variants.some((variant) => variant.status === "active")) {
    return "Not on sale: it needs at least one active variant.";
  }
  return "On sale.";
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/** The product's own images (the ones no variant owns), in position order. */
export function productImages(images: ProductImage[]): ProductImage[] {
  return images
    .filter((image) => image.variant_id === null)
    .sort((a, b) => a.position - b.position);
}

/** The images of one variant, in position order. */
export function variantImages(images: ProductImage[], variantId: string): ProductImage[] {
  return images
    .filter((image) => image.variant_id === variantId)
    .sort((a, b) => a.position - b.position);
}

/** How many of the product's image slots are used, and whether they are all used. */
export function productImageSlots(images: ProductImage[]): {
  used: number;
  max: number;
  full: boolean;
} {
  const used = productImages(images).length;
  return { used, max: PRODUCT_IMAGES_MAX, full: used >= PRODUCT_IMAGES_MAX };
}

/** How many of one variant's image slots are used, and whether they are all used. */
export function variantImageSlots(
  images: ProductImage[],
  variantId: string,
): { used: number; max: number; full: boolean } {
  const used = variantImages(images, variantId).length;
  return { used, max: VARIANT_IMAGES_MAX, full: used >= VARIANT_IMAGES_MAX };
}

// ---------------------------------------------------------------------------
// Product <-> form
// ---------------------------------------------------------------------------

/** An empty form, ready for a new product. */
export function emptyProductForm(): ProductFormValues {
  return { category_id: "", brand_id: "", name: "", description: "" };
}

/** Hydrate the form from a loaded product. A null brand becomes the picker's empty value. */
export function productToFormValues(product: Product): ProductFormValues {
  return {
    category_id: product.category_id,
    brand_id: product.brand_id ?? "",
    name: product.name,
    description: product.description ?? "",
  };
}

/**
 * Hydrate the attribute inputs from a loaded product's stored values.
 *
 * A value is read out of the field its attribute type uses; a `SELECT` keeps the option
 * id, which is what the picker binds to.
 */
export function productToAttributeValues(
  attributes: ProductAttribute[],
): AttributeValuesById {
  const values: AttributeValuesById = {};
  for (const attribute of attributes) {
    values[attribute.attribute_id] = {
      optionId: attribute.option_id ?? "",
      valueText: attribute.value_text ?? "",
      valueNumber: attribute.value_number === null ? "" : String(attribute.value_number),
    };
  }
  return values;
}

/**
 * Build the request's attribute list from the form's values.
 *
 * Only attributes the seller actually filled are sent, each with exactly the field its
 * type asks for. Variation attributes are never included: they are the axes of the
 * variant table, and sending one to the product is a `422 attribute_is_variation`.
 */
export function attributesToPayload(
  attributes: CategoryAttribute[],
  values: AttributeValuesById,
): AttributeValuePayload[] {
  const payload: AttributeValuePayload[] = [];

  for (const attribute of attributes) {
    if (attribute.is_variation) continue;
    const input = values[attribute.id];
    if (attributeValueIsEmpty(input)) continue;

    switch (attribute.type) {
      case "TEXT": {
        const value = (input?.valueText ?? "").trim();
        if (value !== "") payload.push({ attribute_id: attribute.id, value_text: value });
        break;
      }
      case "NUMBER": {
        const raw = (input?.valueNumber ?? "").trim();
        if (raw === "") break;
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          payload.push({ attribute_id: attribute.id, value_number: parsed });
        }
        break;
      }
      case "SELECT": {
        const optionId = (input?.optionId ?? "").trim();
        if (optionId !== "") {
          payload.push({ attribute_id: attribute.id, option_id: optionId });
        }
        break;
      }
    }
  }

  return payload;
}

/** Build the create body. A product always starts `draft`; there is no status field. */
export function formToCreatePayload(
  form: ProductFormValues,
  attributes: CategoryAttribute[],
  values: AttributeValuesById,
): ProductCreatePayload {
  const description = (form.description ?? "").trim();
  return {
    category_id: form.category_id,
    brand_id: form.brand_id ? form.brand_id : null,
    name: form.name.trim(),
    description: description === "" ? null : description,
    attributes: attributesToPayload(attributes, values),
  };
}

/**
 * Build the update body.
 *
 * The product's category is immutable, so it is never sent (`422` if it were). An absent
 * key leaves a field alone and an explicit `null` clears it, so a field the seller emptied
 * becomes `null` — the only way the contract offers to clear a brand or a description.
 */
export function formToUpdatePayload(
  form: ProductFormValues,
  attributes: CategoryAttribute[],
  values: AttributeValuesById,
): ProductUpdatePayload {
  const description = (form.description ?? "").trim();
  return {
    name: form.name.trim(),
    description: description === "" ? null : description,
    brand_id: form.brand_id ? form.brand_id : null,
    attributes: attributesToPayload(attributes, values),
  };
}

// ---------------------------------------------------------------------------
// Variant matrix
// ---------------------------------------------------------------------------

/**
 * The cartesian product of the category's variation attributes.
 *
 * A category with Color = {Red, Blue} and Size = {S, M} produces four rows. Axes are
 * rendered in the category's own `position` order and options keep their `sort_order`, so
 * the matrix reads the same way every time. The contract caps a variant at
 * `VARIANT_OPTIONS_MAX` axes, and an axis with no options contributes nothing.
 */
export function variantMatrixRows(
  variationAttributes: CategoryAttribute[],
): VariantMatrixRow[] {
  const axes = variationAttributes
    .slice(0, VARIANT_OPTIONS_MAX)
    .filter((attribute) => attribute.options.length > 0);
  if (axes.length === 0) return [];

  let combinations: VariantMatrixRow[] = [{ key: "", options: [], optionLabels: [] }];

  for (const axis of axes) {
    const options = [...axis.options].sort((a, b) => a.sort_order - b.sort_order);
    const next: VariantMatrixRow[] = [];
    for (const row of combinations) {
      for (const option of options) {
        next.push({
          key: "",
          options: [...row.options, { attribute_id: axis.id, option_id: option.id }],
          optionLabels: [...row.optionLabels, option.value],
        });
      }
    }
    combinations = next;
  }

  // The key is the option pair list in render order, which is also what
  // `rowMatchesVariant` compares against a stored variant.
  return combinations.map((row) => ({
    ...row,
    key: row.options.map((option) => `${option.attribute_id}:${option.option_id}`).join("|"),
  }));
}

/**
 * A starting SKU for a matrix row.
 *
 * A suggestion the seller can overwrite, not a guarantee: the contract requires a SKU to
 * be unique within the shop, and only the backend can know whether it is. Diacritics are
 * stripped so a Vietnamese product name still produces a usable code.
 */
export function suggestSku(productName: string, optionLabels: string[]): string {
  const code = (value: string): string =>
    value
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const prefix = code(productName).slice(0, 12) || "SKU";
  const suffix = optionLabels.map(code).filter(Boolean).join("-");
  return (suffix === "" ? prefix : `${prefix}-${suffix}`).slice(0, 64);
}

/** Build a variant create body from a matrix row plus the values entered for it. */
export function rowToVariantPayload(
  row: VariantMatrixRow,
  values: { sku_code: string; price: number; stock: number; status: VariantStatus },
): VariantCreatePayload {
  return {
    sku_code: values.sku_code.trim(),
    price: values.price,
    stock: values.stock,
    status: values.status,
    options: row.options,
  };
}

/** Whether a saved variant's options are the same set as a matrix row's. */
export function rowMatchesVariant(
  row: VariantMatrixRow,
  options: VariantOptionPayload[],
): boolean {
  if (row.options.length !== options.length) return false;
  const wanted = new Map(
    row.options.map((option) => [option.attribute_id, option.option_id]),
  );
  return options.every((option) => wanted.get(option.attribute_id) === option.option_id);
}

/** The label of a saved variant's option combination, for its table row. */
export function variantOptionLabel(
  options: { attribute_name: string; option_value: string }[],
): string {
  return options.map((option) => `${option.attribute_name}: ${option.option_value}`).join(" · ");
}

/** An integer field's value for a text input, empty when the value is absent. */
export function numberInputValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

/** The attribute-input holder for one attribute, defaulted to empty. */
export function emptyAttributeValue(): AttributeValueInput {
  return { optionId: "", valueText: "", valueNumber: "" };
}