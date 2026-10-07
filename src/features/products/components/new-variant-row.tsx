"use client";

import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Plus } from "react-feather";

import { rowToVariantPayload, suggestSku, formatVnd } from "features/products/mapping";
import type { VariantMatrixRow } from "features/products/mapping";
import { useCreateVariantMutation } from "features/products/mutations";

import { emptyVariantDraft, parseDraft, type VariantDraft } from "./variant-draft";

interface NewVariantRowProps {
  productId: string;
  productName: string;
  row: VariantMatrixRow;
  canWrite: boolean;
}

/**
 * One combination that does not exist yet, and the fields to create it.
 *
 * The SKU starts as a suggestion derived from the product name and the options, because
 * typing one per combination by hand is the tedious part of a matrix; the seller can
 * overwrite it, and only the backend can confirm it is unique within the shop.
 */
export default function NewVariantRow({
  productId,
  productName,
  row,
  canWrite,
}: NewVariantRowProps) {
  const create = useCreateVariantMutation(productId);
  const [draft, setDraft] = useState<VariantDraft>(() =>
    emptyVariantDraft(suggestSku(productName, row.optionLabels)),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patch = (next: Partial<VariantDraft>): void =>
    setDraft((current) => ({ ...current, ...next }));

  const add = (): void => {
    const { values, errors: fieldErrors } = parseDraft(draft);
    setErrors(fieldErrors);
    if (!values) return;
    create.mutate(rowToVariantPayload(row, values));
  };

  return (
    <tr>
      <td className="text-secondary small">
        {row.optionLabels.length === 0 ? "No options" : row.optionLabels.join(" · ")}
      </td>
      <td style={{ minWidth: 160 }}>
        <Form.Control
          size="sm"
          value={draft.sku_code}
          aria-label={`SKU for the ${row.optionLabels.join(" ") || "single"} variant`}
          disabled={!canWrite || create.isPending}
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
          placeholder="0"
          value={draft.price}
          aria-label={`Price for the ${row.optionLabels.join(" ") || "single"} variant`}
          disabled={!canWrite || create.isPending}
          isInvalid={Boolean(errors.price)}
          onChange={(event) => patch({ price: event.target.value })}
        />
        {errors.price ? (
          <Form.Control.Feedback type="invalid" className="d-block">
            {errors.price}
          </Form.Control.Feedback>
        ) : (
          <Form.Text className="text-muted">
            {draft.price.trim() === "" ? "In đồng" : formatVnd(Number(draft.price) || 0)}
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
          aria-label={`Stock for the ${row.optionLabels.join(" ") || "single"} variant`}
          disabled={!canWrite || create.isPending}
          isInvalid={Boolean(errors.stock)}
          onChange={(event) => patch({ stock: event.target.value })}
        />
        {errors.stock ? (
          <Form.Control.Feedback type="invalid" className="d-block">
            {errors.stock}
          </Form.Control.Feedback>
        ) : null}
      </td>
      <td className="text-end pe-2">
        {canWrite ? (
          <Button
            type="button"
            variant="outline-primary"
            size="sm"
            className="d-inline-flex align-items-center"
            disabled={create.isPending}
            aria-busy={create.isPending}
            onClick={add}
          >
            <Plus size={14} className="me-1" />
            {create.isPending ? "Adding" : "Add"}
          </Button>
        ) : null}
      </td>
    </tr>
  );
}