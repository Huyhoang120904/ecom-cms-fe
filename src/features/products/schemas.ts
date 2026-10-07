/**
 * Validation for the products module.
 *
 * Three jobs, each with a reason to exist:
 *
 * 1. **Listing state** arrives from the URL, so it is untrusted: a malformed page is
 *    normalized rather than rejected, because a broken link should still render a list.
 *    The contract's list endpoint has no `search` and no category filter, so neither is
 *    advertised here.
 * 2. **Responses** that drive a form or a decision are parsed with Zod, since the wire
 *    types are hand-written and nothing else checks them at runtime.
 * 3. **Attribute values** are validated against the *chosen category's* metadata, which
 *    only exists at runtime: required/optional, `TEXT | NUMBER | SELECT`, and the option
 *    ids that attribute actually offers.
 *
 * Client validation is a courtesy to the seller, never an authorization claim. The
 * backend re-validates everything, and the backend's `details.missing[]` is what the form
 * marks after a refused publish.
 */

import { z } from "zod";

import type { CategoryAttribute } from "features/catalog";

import {
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  PRICE_MAX,
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_NAME_MIN,
  PRODUCT_STATUSES,
  SKU_CODE_MAX,
  SKU_CODE_MIN,
  STOCK_MAX,
  VALUE_NUMBER_ABS_MAX,
  VALUE_TEXT_MAX,
  VARIANT_STATUSES,
} from "./constants";
import type { Product, ProductImage, ProductPage, ProductStatus, Variant } from "./types";

// ---------------------------------------------------------------------------
// Listing state
// ---------------------------------------------------------------------------

const normalizedPage = z.preprocess((value) => {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}, z.number().int().min(1));

// An out-of-range page size is clamped into the supported range instead of throwing
// during render.
const normalizedPageSize = z.preprocess((value) => {
  const pageSize = Number(value);
  if (!Number.isInteger(pageSize) || pageSize < 1) return PAGE_SIZE_DEFAULT;
  return Math.min(pageSize, PAGE_SIZE_MAX);
}, z.number().int().min(1).max(PAGE_SIZE_MAX));

const normalizedStatus = z.preprocess((value) => {
  return typeof value === "string" && (PRODUCT_STATUSES as readonly string[]).includes(value)
    ? value
    : undefined;
}, z.enum(PRODUCT_STATUSES).optional());

export const productFilterSchema = z.object({
  status: normalizedStatus,
  page: normalizedPage,
  pageSize: normalizedPageSize,
});

export type ProductFilters = z.infer<typeof productFilterSchema>;

/** Normalize an untrusted query object into a valid product filter. */
export function parseProductFilters(
  query: Record<string, string | string[] | undefined> = {},
): ProductFilters {
  const status = query.status;
  return productFilterSchema.parse({
    status: typeof status === "string" ? status : undefined,
    page: query.page,
    pageSize: query.pageSize,
  });
}

/** Whether a string is one of the contract's product statuses. */
export function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const variantStatusSchema = z.enum(VARIANT_STATUSES);

export const productImageSchema = z.object({
  id: z.string(),
  variant_id: z.string().nullable(),
  position: z.number().int(),
  url: z.string(),
}) satisfies z.ZodType<ProductImage>;

export const productImageListSchema = z.array(productImageSchema);

export const productAttributeSchema = z.object({
  attribute_id: z.string(),
  name: z.string(),
  type: z.enum(["TEXT", "NUMBER", "SELECT"]),
  option_id: z.string().nullable(),
  option_value: z.string().nullable(),
  value_text: z.string().nullable(),
  value_number: z.number().nullable(),
});

export const variantSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  sku_code: z.string(),
  price: z.number().int(),
  stock: z.number().int(),
  status: variantStatusSchema,
  options: z.array(
    z.object({
      attribute_id: z.string(),
      attribute_name: z.string(),
      option_id: z.string(),
      option_value: z.string(),
    }),
  ),
  images: productImageListSchema,
}) satisfies z.ZodType<Variant>;

export const variantListSchema = z.array(variantSchema);

export const productSummarySchema = z.object({
  id: z.string(),
  category_id: z.string(),
  brand_id: z.string().nullable(),
  name: z.string(),
  status: productStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const productPageSchema = z.object({
  items: z.array(productSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  page_size: z.number().int(),
}) satisfies z.ZodType<ProductPage>;

export const productSchema = z.object({
  id: z.string(),
  category_id: z.string(),
  brand_id: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  status: productStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  attributes: z.array(productAttributeSchema),
  variants: variantListSchema,
  images: productImageListSchema,
}) satisfies z.ZodType<Product>;

// ---------------------------------------------------------------------------
// Write requests
// ---------------------------------------------------------------------------

export const productFormSchema = z.object({
  category_id: z.string().min(1, "Choose a category."),
  // The form holds "" for "no brand", which the mapping turns into an explicit `null`.
  brand_id: z.string().nullish(),
  name: z
    .string()
    .trim()
    .min(PRODUCT_NAME_MIN, `Use at least ${PRODUCT_NAME_MIN} characters.`)
    .max(PRODUCT_NAME_MAX, `Use at most ${PRODUCT_NAME_MAX} characters.`),
  description: z
    .string()
    .max(PRODUCT_DESCRIPTION_MAX, `Use at most ${PRODUCT_DESCRIPTION_MAX} characters.`)
    .nullish(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const variantRowSchema = z.object({
  sku_code: z
    .string()
    .trim()
    .min(SKU_CODE_MIN, "Enter a SKU.")
    .max(SKU_CODE_MAX, `Use at most ${SKU_CODE_MAX} characters.`),
  // Money crosses the wire as an integer number of the smallest VND unit, so a decimal
  // is rejected here rather than silently rounded by the server.
  price: z
    .number({ message: "Enter a price in whole đồng." })
    .int("Enter a whole number of đồng.")
    .min(0, "Price cannot be negative.")
    .max(PRICE_MAX),
  stock: z
    .number()
    .int("Enter a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(STOCK_MAX),
  status: variantStatusSchema,
});

export type VariantRowValues = z.infer<typeof variantRowSchema>;

// ---------------------------------------------------------------------------
// Attribute values, validated against the category's own metadata
// ---------------------------------------------------------------------------

/** One attribute's raw form input: every field is a string from the DOM. */
export interface AttributeValueInput {
  optionId?: string;
  valueText?: string;
  valueNumber?: string;
}

export type AttributeValuesById = Record<string, AttributeValueInput | undefined>;

/** Whether a value entry carries anything at all. */
export function attributeValueIsEmpty(input: AttributeValueInput | undefined): boolean {
  if (input === undefined) return true;
  return (
    (input.optionId ?? "").trim() === "" &&
    (input.valueText ?? "").trim() === "" &&
    (input.valueNumber ?? "").trim() === ""
  );
}

/**
 * Per-attribute validation messages, keyed by attribute id.
 *
 * An empty map means every value is usable. Required attributes are checked against the
 * category's configuration rather than a list kept here, so a category that makes an
 * attribute required demands it in this form immediately.
 */
export function attributeValueErrors(
  attributes: CategoryAttribute[],
  values: AttributeValuesById,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const attribute of attributes) {
    const input = values[attribute.id];

    if (attributeValueIsEmpty(input)) {
      if (attribute.required) {
        errors[attribute.id] = `${attribute.name} is required.`;
      }
      continue;
    }

    switch (attribute.type) {
      case "TEXT": {
        if ((input?.valueText ?? "").trim().length > VALUE_TEXT_MAX) {
          errors[attribute.id] = `Use at most ${VALUE_TEXT_MAX} characters.`;
        }
        break;
      }
      case "NUMBER": {
        const raw = (input?.valueNumber ?? "").trim();
        const parsed = Number(raw);
        if (raw === "" || !Number.isFinite(parsed)) {
          errors[attribute.id] = "Enter a number.";
        } else if (Math.abs(parsed) > VALUE_NUMBER_ABS_MAX) {
          errors[attribute.id] = "That number is out of range.";
        }
        break;
      }
      case "SELECT": {
        const chosen = (input?.optionId ?? "").trim();
        if (!attribute.options.some((option) => option.id === chosen)) {
          errors[attribute.id] = `Choose one of the ${attribute.name} options.`;
        }
        break;
      }
    }
  }

  return errors;
}

/** The form label for an attribute, marking the ones the category requires. */
export function attributeFieldLabel(attribute: CategoryAttribute): string {
  return attribute.required ? `${attribute.name} *` : attribute.name;
}