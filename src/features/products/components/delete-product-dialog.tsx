"use client";

import { useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { Trash2 } from "react-feather";

import { useDeleteProductMutation } from "features/products/mutations";
import type { Product } from "features/products/types";

interface DeleteProductDialogProps {
  product: Product;
  /** Navigates back to the list once the product is gone. */
  onDeleted: () => void;
}

/**
 * Typed-name confirmation for deleting a product.
 *
 * Never `window.confirm`: it cannot be styled, it blocks the page, and — most importantly —
 * it cannot make the seller type the product's name, which is the only thing that turns a
 * reflexive click into a decision. A product is soft-deleted and there is no restore
 * endpoint, so the copy says so.
 */
export default function DeleteProductDialog({ product, onDeleted }: DeleteProductDialogProps) {
  const remove = useDeleteProductMutation(product.id);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const matches = typed.trim() === product.name;

  const close = (): void => {
    setOpen(false);
    setTyped("");
  };

  if (!open) {
    return (
      <div>
        <Button type="button" variant="outline-danger" size="sm" onClick={() => setOpen(true)}>
          <Trash2 size={14} className="me-1" />
          Delete product
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-danger rounded p-3" role="group" aria-label="Delete product">
      <h3 className="h6 fw-bold text-danger mb-2">Delete {product.name}</h3>

      <ul className="text-muted small mb-3">
        <li>It is removed from this shop&apos;s product list immediately.</li>
        <li>Buyers can no longer reach it, whatever status it had.</li>
        <li>There is no restore in this version, so type the name to be sure.</li>
      </ul>

      {remove.error ? (
        <Alert variant="danger" role="alert" className="py-2">
          {remove.error.message}
        </Alert>
      ) : null}

      <Form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (matches) remove.mutate(undefined, { onSuccess: onDeleted });
        }}
      >
        <Form.Group className="mb-3" controlId="delete-product-name">
          <Form.Label>Type {product.name} to confirm</Form.Label>
          <Form.Control
            value={typed}
            autoComplete="off"
            aria-describedby="delete-product-hint"
            onChange={(event) => setTyped(event.target.value)}
          />
          <Form.Text id="delete-product-hint" className="text-muted">
            The name must match exactly.
          </Form.Text>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button
            type="submit"
            variant="danger"
            size="sm"
            disabled={!matches || remove.isPending}
            aria-busy={remove.isPending}
          >
            {remove.isPending ? "Deleting" : "Delete this product"}
          </Button>
          <Button type="button" variant="outline-secondary" size="sm" onClick={close}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}