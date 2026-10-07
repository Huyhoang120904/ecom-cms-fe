import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body: string;
  /** The one next action that creates data, offered only to a role that may take it. */
  action?: EmptyStateAction;
  /** Fallback copy when the role cannot take the action (for example, read-only). */
  children?: ReactNode;
}

/** Honest empty state: the surface says it is empty and names the next step. */
export default function EmptyState({ icon, title, body, action, children }: EmptyStateProps) {
  return (
    <div className="text-center px-4 py-5" role="status">
      {icon ? (
        <div className="empty-state-icon mx-auto mb-3" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <p className="mb-1 fw-semibold text-dark fs-4">{title}</p>
      <p className="text-muted mb-0 mx-auto" style={{ maxWidth: 460 }}>
        {body}
      </p>
      {action ? (
        <Link href={action.href} className="btn btn-primary btn-sm mt-3">
          {action.label}
        </Link>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
