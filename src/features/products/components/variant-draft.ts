/**
 * The draft helpers the variant table and the new-row matrix share.
 *
 * Pure functions in one place, so "what counts as dirty" and "what the contract accepts"
 * are answered identically whether a seller is editing a saved variant or filling in a
 * new one.
 */

import { variantRowSchema, type VariantRowValues } from "features/products/schemas";
import { numberInputValue } from "features/products/mapping";
import type { Variant } from "features/products/types";

/** The editable fields of one variant row. Prices and stock are strings from the DOM. */
export interface VariantDraft {
  sku_code: string;
  price: string;
  stock: string;
  status: VariantRowValues["status"];
}

export function draftFromVariant(variant: Variant): VariantDraft {
  return {
    sku_code: variant.sku_code,
    price: numberInputValue(variant.price),
    stock: numberInputValue(variant.stock),
    status: variant.status,
  };
}

export function isDirty(draft: VariantDraft, variant: Variant): boolean {
  return (
    draft.sku_code !== variant.sku_code ||
    draft.price !== numberInputValue(variant.price) ||
    draft.stock !== numberInputValue(variant.stock) ||
    draft.status !== variant.status
  );
}

export function emptyVariantDraft(sku = ""): VariantDraft {
  return { sku_code: sku, price: "", stock: "0", status: "active" };
}

/**
 * Validate a draft, returning either the values the contract wants or per-field messages.
 *
 * An empty price or stock is passed through as `undefined` so the schema reports
 * "Enter a price" rather than coercing an empty string into a zero the seller never typed.
 */
export function parseDraft(draft: VariantDraft): {
  values: VariantRowValues | null;
  errors: Record<string, string>;
} {
  const parsed = variantRowSchema.safeParse({
    sku_code: draft.sku_code,
    price: draft.price.trim() === "" ? undefined : Number(draft.price),
    stock: draft.stock.trim() === "" ? undefined : Number(draft.stock),
    status: draft.status,
  });

  if (parsed.success) {
    return { values: parsed.data, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? "sku_code");
    errors[field] ??= issue.message;
  }
  return { values: null, errors };
}