"use client";

import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Save, Trash2 } from "react-feather";

import { VARIANT_STATUSES } from "features/products/constants";
import { formatVnd, numberInputValue, variantStatusLabel } from "features/products/mapping";
import { useDeleteVariantMutation, useUpdateVariantMutation } from "features/products/mutations";
import { variantRowSchema, type VariantRowValues } from "features/products/schemas";
import type { Variant } from "features/products/types";

import { draftFromVariant, isDirty, parseDraft, type VariantDraft } from "./variant-draft";

interface VariantRowProps {
  productId: string;
  variant: Variant;
  canWrite: boolean;
}

/**
 * One saved variant, editable in place.
 *
 * SKU, price, stock, and status are the fields the contract allows a `PATCH` to change; the
 * option combination is deliberately absent, because a different combination is a
 * different variant. The row keeps its own draft so typing stays local, and it commits
 * optimistically into the shared product cache.
 */
export default function VariantRow({ productId, variant, canWrite }: VariantRowProps) {
  const update = useUpdateVariantMutation(productId);
  const remove = useDeleteVariantMutation(productId);

  const [draft, setDraft] = useState<VariantDraft>(() => draftFromVariant(variant));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = isDirty(draft, variant);
  const pending = update.isPending || remove.isPending;

  const patch = (next: Partial<VariantDraft>): void =>
    setDraft((current) => ({ ...current, ...next }));

  const save = (): void => {
    const { values, errors: fieldErrors } = parseDraft(draft);
    setErrors(fieldErrors);
    if (!values) return;

    update.mutate(
      {
        variantId: variant.id,
        payload: {
          sku_code: values.sku_code,
          price: values.price,
          stock: values.stock,
          status: values.status,
        },
      },
      { onSuccess: () => setDraft(draftFromVariant({ ...variant, ...values }) ) },
    );
  };

  return (
    <tr>
      <td className="text-secondary small">
        {variant.options.length === 0 ? "No options" : variant.sku_code}
      </td>
      <td style={{ minWidth: 160 }}>
        <Form.Control
          size="sm"
          value={draft.sku_code}
          aria-label={`SKU for ${variant.sku_code}`}
          disabled={!canWrite || pending}
          isInvalid={Boolean(errors.sku_code)}
          onChange={(event) => patch({ sku_code: event.target.value })}
        />
        {errors.sku_code ? (
          <Form.Control.Feedback type="invalid" className="d-block">
            {errors.sku_code}
          </Form.Control.Feedback>
        ) : null}
      </td>
      <td style={{ minWidth: 140 }}>
        <Form.Control
          size="sm"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={draft.price}
          aria-label={`Price for ${variant.sku_code}`}
          disabled={!canWrite || pending}
          isInvalid={Boolean(errors.price)}
          onChange={(event) => patch({ price: event.target.value })}
        />
        {errors.price ? (
          <Form.Control.Feedback type="invalid" className="d-block">
            {errors.price}
          </Form.Control.Feedback>
        ) : (
          <Form.Text className="text-muted">
            {draft.price.trim() === "" ? "\u00a0" : formatVnd(Number(draft.price) || 0)}
          </Form.Text>
        )}
      </td>
      <td style={{ minWidth: 110 }}>
        <Form.Control
          size="sm"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={draft.stock}
          aria-label={`Stock for ${variant.sku_code}`}
          disabled={!canWrite || pending}
          isInvalid={Boolean(errors.stock)}
          onChange={(event) => patch({ stock: event.target.value })}
        />
        {errors.stock ? (
          <Form.Control.Feedback type="invalid" className="d-block">
            {errors.stock}
          </Form.Control.Feedback>
        ) : null}
      </td>
      <td style={{ minWidth: 120 }}>
        <Form.Select
          size="sm"
          value={draft.status}
          aria-label={`Status for ${variant.sku_code}`}
          disabled={!canWrite || pending}
          onChange={(event) =>
            patch({ status: event.target.value as VariantRowValues["status"] })
          }
        >
          {VARIANT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {variantStatusLabel(status)}
            </option>
          ))}
        </Form.Select>
      </td>
      <td className="text-end pe-2">
        {canWrite ? (
          <div className="d-inline-flex gap-1">
            <Button
              type="button"
              variant={dirty ? "primary" : "outline-secondary"}
              size="sm"
              className="px-2 py-1"
              aria-label={`Save ${variant.sku_code}`}
              disabled={!dirty || pending}
              onClick={save}
            >
              <Save size={14} />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              className="px-2 py-1"
              aria-label={`Delete ${variant.sku_code}`}
              disabled={pending}
              onClick={() => remove.mutate(variant.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}