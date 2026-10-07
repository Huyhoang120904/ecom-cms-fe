import type { ReactNode } from "react";
import { Button, Card } from "react-bootstrap";
import { RotateCcw } from "react-feather";

interface FilterBarProps {
  children: ReactNode;
  /** Pass only while a filter is active; the reset control appears with it. */
  onReset?: () => void;
}

/** The list card's filter toolbar: a search landmark with an optional reset. */
export default function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <Card.Body className="px-4 py-3 border-bottom">
      <form
        role="search"
        className="d-flex flex-wrap align-items-center gap-3"
        onSubmit={(event) => event.preventDefault()}
      >
        {children}
        {onReset ? (
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            onClick={onReset}
          >
            <RotateCcw size={14} className="me-1" aria-hidden="true" />
            Reset
          </Button>
        ) : null}
      </form>
    </Card.Body>
  );
}
