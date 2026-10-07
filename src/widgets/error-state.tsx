import { Alert, Button } from "react-bootstrap";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Error surface: the message and the retry that re-fires the query. */
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="px-4 py-5">
      <Alert variant="danger" role="alert" className="mb-3">
        {message}
      </Alert>
      {onRetry ? (
        <Button type="button" variant="outline-secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
