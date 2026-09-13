import { Col, Row } from "react-bootstrap";

import PageHeading from "widgets/page-heading";

import BackendStatusPanel from "features/dashboard/components/backend-status-panel";

/** Seller CMS landing page: real backend status plus an honest empty summary. */
export default function DashboardPage() {
  return (
    <div className="container-fluid p-6">
      <PageHeading heading="Dashboard" />

      <Row className="g-4">
        <Col xl={6}>
          <BackendStatusPanel />
        </Col>
        <Col xl={6}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body px-4 py-4">
              <h4>Operational summary</h4>
              <p className="text-muted mb-0">
                No products or orders exist yet. Summaries appear here once the
                catalogue and order modules expose their endpoints.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
