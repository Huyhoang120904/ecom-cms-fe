import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "react-bootstrap";

export interface BulkBarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "outline-secondary" | "danger";
  confirm?: { title: string; body: string; confirmLabel: string };
}

export interface BulkBarProps {
  countLabel: string;
  actions: BulkBarAction[];
  onAction: (id: string) => void;
  onClear: () => void;
  isPending?: boolean;
}

/** Selection bar: the count, one-tap actions, an inline confirm, pending state. */
export default function BulkBar({
  countLabel,
  actions,
  onAction,
  onClear,
  isPending = false,
}: BulkBarProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const pendingAction = actions.find((action) => action.id === confirming);

  function act(action: BulkBarAction) {
    if (action.confirm) setConfirming(action.id);
    else onAction(action.id);
  }

  function clear() {
    setConfirming(null);
    onClear();
  }

  return (
    <div className="bulk-bar">
      <span className="bulk-bar-count" role="status">
        {countLabel}
      </span>
      <div className="d-flex flex-wrap align-items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant={action.variant ?? "outline-secondary"}
            size="sm"
            className="d-inline-flex align-items-center gap-1"
            disabled={isPending}
            onClick={() => act(action)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="text-decoration-none"
          disabled={isPending}
          onClick={clear}
        >
          Clear
        </Button>
      </div>
      {pendingAction?.confirm ? (
        <div className="bulk-bar-confirm" role="group" aria-label={pendingAction.confirm.title}>
          <strong className="d-block mb-1">{pendingAction.confirm.title}</strong>
          <p className="text-muted small mb-2">{pendingAction.confirm.body}</p>
          <div className="d-flex gap-2">
            <Button
              type="button"
              variant={pendingAction.variant ?? "outline-secondary"}
              size="sm"
              disabled={isPending}
              onClick={() => {
                setConfirming(null);
                onAction(pendingAction.id);
              }}
            >
              {pendingAction.confirm.confirmLabel}
            </Button>
            <Button type="button" variant="outline-secondary" size="sm" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
