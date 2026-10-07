import type { ReactNode } from "react";
import { Card } from "react-bootstrap";

export type StatTone = "primary" | "success" | "warning" | "danger" | "info";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatTone;
}

/** A single shopee-card statistic: label, tabular value, hint, toned icon. */
export default function StatCard({ label, value, hint, icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="shopee-card h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted text-uppercase fw-semibold fs-6">{label}</span>
          {icon ? (
            <div className={`stat-icon stat-icon-${tone}`} aria-hidden="true">
              {icon}
            </div>
          ) : null}
        </div>
        <p className="fs-4 fw-bold mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>
          {value}
        </p>
        {hint ? <span className="text-muted small">{hint}</span> : null}
      </Card.Body>
    </Card>
  );
}
