import { Card, Table } from "react-bootstrap";

/** Loading skeleton for the products table. */
export default function ProductsTableSkeleton() {
  return (
    <Table responsive className="align-middle mb-0">
      <thead>
        <tr>
          <th scope="col">Product</th>
          <th scope="col">Status</th>
          <th scope="col">Updated</th>
        </tr>
      </thead>
      <tbody>
        {[0, 1, 2].map((row) => (
          <tr key={row} aria-hidden="true">
            <td>
              <span className="d-block bg-light rounded" style={{ height: 16 }} />
            </td>
            <td>
              <span
                className="d-block bg-light rounded"
                style={{ height: 16, width: 72 }}
              />
            </td>
            <td>
              <span
                className="d-block bg-light rounded"
                style={{ height: 16, width: 96 }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/** Honest empty state: no rows are fabricated when the list has no data. */
export function ProductsEmptyState() {
  return (
    <Card.Body className="px-4 py-5 text-center">
      <p className="mb-1 fw-semibold">No products yet</p>
      <p className="text-muted mb-0">
        The catalogue module has not published a product endpoint, so there is
        nothing to list.
      </p>
    </Card.Body>
  );
}
