import { Badge, Card, Spinner, Table } from "react-bootstrap";

import { useLivenessQuery, useReadinessQuery } from "features/dashboard/queries";

/**
 * Operational status panel.
 *
 * Reports only what the backend actually exposes: liveness and readiness. No
 * products, orders, revenue, or seller counts are invented.
 */
export default function BackendStatusPanel() {
  const liveness = useLivenessQuery();
  const readiness = useReadinessQuery();

  const dependencyRows = [
    { name: "Database", status: readiness.data?.dependencies.database },
    { name: "Redis", status: readiness.data?.dependencies.redis },
  ];

  const apiUnreachable = liveness.isError || readiness.isError;
  const notReady = readiness.data?.status === "not_ready";

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-bottom px-4 py-3">
        <div className="d-flex align-items-center justify-content-between">
          <h4 className="mb-0">Backend status</h4>
          {liveness.isPending || readiness.isPending ? (
            <Spinner animation="border" size="sm" role="status" />
          ) : null}
        </div>
      </Card.Header>

      <Card.Body className="px-4 py-4">
        {apiUnreachable ? (
          <p className="text-danger mb-3">
            The API did not respond. Start ecom-be, then reload this page.
          </p>
        ) : null}

        {notReady ? (
          <p className="text-warning-emphasis mb-3">
            The API is running but reports itself not ready. Start the local
            PostgreSQL and Redis services, then reload.
          </p>
        ) : null}

        <dl className="row mb-0">
          <dt className="col-sm-4 fw-normal text-muted">API</dt>
          <dd className="col-sm-8">
            <Badge bg={liveness.isSuccess ? "success" : "secondary"}>
              {liveness.isSuccess ? "reachable" : "unknown"}
            </Badge>
          </dd>

          <dt className="col-sm-4 fw-normal text-muted">Service</dt>
          <dd className="col-sm-8">{liveness.data?.service ?? "not reported"}</dd>

          <dt className="col-sm-4 fw-normal text-muted">Readiness</dt>
          <dd className="col-sm-8">
            <Badge bg={notReady ? "warning" : "success"}>
              {readiness.data?.status ?? "unknown"}
            </Badge>
          </dd>
        </dl>

        <Table borderless size="sm" className="mb-0 mt-3">
          <caption className="text-muted">
            Dependency probes reported by GET /health/ready.
          </caption>
          <thead>
            <tr>
              <th scope="col">Dependency</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {dependencyRows.map((row) => (
              <tr key={row.name}>
                <th scope="row" className="fw-normal">
                  {row.name}
                </th>
                <td>{row.status ?? "unknown"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
