import { useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";

import { PASSWORD_MAX } from "lib/auth/constants";

import { useDeactivateMutation } from "features/auth/mutations";
import { deactivateSchema } from "features/auth/schemas";

interface DeactivateDialogProps {
  /** Navigates away once the account is deactivated. */
  onDeactivated: () => void;
}

/**
 * Two-step inline confirmation for deactivating the account.
 *
 * Never `window.confirm`: that cannot require a password, cannot be styled, and
 * blocks the whole page. The copy states plainly how to undo this, including that
 * there is no self-service way back, because a seller deciding to do this deserves
 * to know before they do it rather than afterwards.
 */
export default function DeactivateDialog({ onDeactivated }: DeactivateDialogProps) {
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const deactivate = useDeactivateMutation();

  const close = (): void => {
    setOpen(false);
    setAcknowledged(false);
    setPassword("");
    setFieldError(null);
  };

  const confirm = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFieldError(null);

    const parsed = deactivateSchema.safeParse({ password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter your password.");
      return;
    }

    deactivate.mutate(parsed.data, { onSuccess: onDeactivated });
  };

  if (!open) {
    return (
      <div>
        <Button type="button" variant="outline-danger" onClick={() => setOpen(true)}>
          Deactivate account
        </Button>
        <p className="text-muted small mt-2 mb-0">
          You can do this at any time. It signs you out everywhere.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-danger rounded p-3" role="group" aria-label="Deactivate account">
      <h3 className="h6 fw-bold text-danger mb-2">
        Deactivating ends every session
      </h3>

      <ul className="text-muted small mb-3">
        <li>Your account, shops, and their data are kept.</li>
        <li>Every session on every device is signed out.</li>
        <li>Signing in is not possible until the account is restored.</li>
        <li>
          There is no self-service way to restore it at the moment. An operator has
          to do that, so contact whoever gave you access.
        </li>
      </ul>

      {deactivate.error ? (
        <Alert variant="danger" role="alert" className="py-2">
          {deactivate.error.message}
        </Alert>
      ) : null}

      <Form noValidate onSubmit={confirm}>
        <Form.Group className="mb-3" controlId="deactivate-password">
          <Form.Label>Your password</Form.Label>
          <Form.Control
            type="password"
            autoComplete="current-password"
            value={password}
            maxLength={PASSWORD_MAX}
            isInvalid={Boolean(fieldError)}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldError ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldError}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Form.Group className="mb-3" controlId="deactivate-acknowledge">
          <Form.Check
            type="checkbox"
            label="I understand this ends my sessions and cannot be undone here."
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button
            type="submit"
            variant="danger"
            disabled={!acknowledged || deactivate.isPending}
            aria-busy={deactivate.isPending}
          >
            {deactivate.isPending ? "Deactivating" : "Confirm deactivation"}
          </Button>
          <Button type="button" variant="outline-secondary" onClick={close}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}
