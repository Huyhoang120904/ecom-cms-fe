"use client";

import { useMemo } from "react";
import { Table } from "react-bootstrap";

import type { CategoryAttribute } from "features/catalog";
import { rowMatchesVariant, variantMatrixRows } from "features/products/mapping";
import type { Product } from "features/products/types";

import NewVariantRow from "./new-variant-row";
import VariantRow from "./variant-row";

interface VariantSectionProps {
  product: Product;
  /** The category's variation attributes: the axes of the matrix below the table. */
  variationAttributes: CategoryAttribute[];
  canWrite: boolean;
}

/**
 * The product's variants, and the combinations that would create more.
 *
 * A variant's option combination is fixed at creation, so this table edits what the
 * contract allows — SKU, price, stock, status — and every combination the category offers
 * that is not saved yet appears as a row to add. Nothing is pre-created: a variant is a
 * sellable unit with a price, and the seller decides which ones exist.
 */
export default function VariantSection({
  product,
  variationAttributes,
  canWrite,
}: VariantSectionProps) {
  const rows = useMemo(() => variantMatrixRows(variationAttributes), [variationAttributes]);

  // A matrix row whose combination already exists is a saved variant, not a new one.
  const missingRows = rows.filter(
    (row) => !product.variants.some((variant) => rowMatchesVariant(row, variant.options)),
  );

  const hasAxes = rows.length > 0;
  // A category with no variation options still needs a way to create the product's single
  // variant, which is what an empty option list is for.
  const showSingleRow = !hasAxes && product.variants.length === 0;

  return (
    <div>
      {product.variants.length === 0 ? (
        <p className="text-muted small mb-3">
          No variants yet. A product is only sold once it has at least one active variant.
        </p>
      ) : (
        <Table responsive className="align-middle mb-4">
          <thead className="table-light">
            <tr>
              <th scope="col">Variant</th>
              <th scope="col">SKU</th>
              <th scope="col">Price (đồng)</th>
              <th scope="col">Stock</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end pe-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant) => (
              <VariantRow
                key={variant.id}
                productId={product.id}
                variant={variant}
                canWrite={canWrite}
              />
            ))}
          </tbody>
        </Table>
      )}

      {!hasAxes ? (
        <p className="text-muted small mb-0">
          This product&apos;s category configures no variation options, so it can have a single
          variant with no options.
        </p>
      ) : missingRows.length === 0 ? (
        <p className="text-muted small mb-0">
          Every combination this category offers is already a variant.
        </p>
      ) : (
        <>
          <h3 className="h6 mb-2">Add variants</h3>
          <p className="text-muted small mb-2">
            Each row is one combination of{" "}
            {variationAttributes.map((attribute) => attribute.name).join(", ")}. The SKU is a
            suggestion; the backend decides whether it is unique in this shop.
          </p>
          <Table responsive className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">Combination</th>
                <th scope="col">SKU</th>
                <th scope="col">Price (đồng)</th>
                <th scope="col">Stock</th>
                <th scope="col" className="text-end pe-2">Add</th>
              </tr>
            </thead>
            <tbody>
              {missingRows.map((row) => (
                <NewVariantRow
                  key={row.key}
                  productId={product.id}
                  productName={product.name}
                  row={row}
                  canWrite={canWrite}
                />
              ))}
            </tbody>
          </Table>
        </>
      )}

      {showSingleRow ? (
        <Table responsive className="align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col">Combination</th>
              <th scope="col">SKU</th>
              <th scope="col">Price (đồng)</th>
              <th scope="col">Stock</th>
              <th scope="col" className="text-end pe-2">Add</th>
            </tr>
          </thead>
          <tbody>
            <NewVariantRow
              productId={product.id}
              productName={product.name}
              row={{ key: "single", options: [], optionLabels: [] }}
              canWrite={canWrite}
            />
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}