import { useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";

import { SHOP_NAME_MAX } from "lib/auth/constants";

import { useDeleteShopMutation } from "features/shop/mutations";
import { deleteShopSchema } from "features/auth/schemas";
import type { Shop } from "features/auth/types";

interface DeleteShopDialogProps {
  shop: Shop;
  /** Navigates away once the shop is retired. */
  onDeleted: () => void;
}

/**
 * Two-step confirmation for retiring the shop.
 *
 * The seller has to type the shop's own name, and the comparison is case-sensitive
 * on the server: a mistyped name is refused there regardless of what happens here.
 * This checks locally only so the button can explain itself before a round trip.
 */
export default function DeleteShopDialog({ shop, onDeleted }: DeleteShopDialogProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const remove = useDeleteShopMutation();

  const matches = typed.trim() === shop.name;

  const close = (): void => {
    setOpen(false);
    setTyped("");
    setFieldError(null);
  };

  const confirm = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFieldError(null);

    const parsed = deleteShopSchema.safeParse({ confirm_shop_name: typed });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Type the shop name.");
      return;
    }

    remove.mutate(parsed.data, { onSuccess: onDeleted });
  };

  if (!open) {
    return (
      <div>
        <Button type="button" variant="outline-danger" onClick={() => setOpen(true)}>
          Delete shop
        </Button>
        <p className="text-muted small mt-2 mb-0">
          Retiring a shop ends access to it for every member.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-danger rounded p-3" role="group" aria-label="Delete shop">
      <h3 className="h6 fw-bold text-danger mb-2">Retire {shop.name}</h3>

      <ul className="text-muted small mb-3">
        <li>The shop is closed and stops appearing anywhere it was listed.</li>
        <li>Its data is retained, so the shop can be restored by an operator.</li>
        <li>The name and slug are released, so another shop can take them.</li>
        <li>Every member loses access, including you.</li>
      </ul>

      {remove.error ? (
        <Alert variant="danger" role="alert" className="py-2">
          {remove.error.message}
        </Alert>
      ) : null}

      <Form noValidate onSubmit={confirm}>
        <Form.Group className="mb-3" controlId="delete-shop-name">
          <Form.Label>Type the shop name to confirm</Form.Label>
          <Form.Control
            type="text"
            value={typed}
            maxLength={SHOP_NAME_MAX}
            placeholder={shop.name}
            isInvalid={Boolean(fieldError)}
            onChange={(event) => setTyped(event.target.value)}
          />
          <Form.Text className="text-muted">
            It has to match exactly, including capital letters.
          </Form.Text>
          {fieldError ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldError}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <div className="d-flex gap-2">
          <Button
            type="submit"
            variant="danger"
            disabled={!matches || remove.isPending}
            aria-busy={remove.isPending}
          >
            {remove.isPending ? "Deleting shop" : "Delete this shop"}
          </Button>
          <Button type="button" variant="outline-secondary" onClick={close}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}
