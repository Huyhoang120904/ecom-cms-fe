import { Row, Col } from "react-bootstrap";
import type { ReactNode } from "react";

interface PageHeadingProps {
  heading: string;
  children?: ReactNode;
}

const PageHeading = ({ heading, children }: PageHeadingProps) => {
  return (
    <Row>
      <Col lg={12} md={12} xs={12}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h1 className="mb-0 fw-semibold" style={{ fontSize: "1rem", color: "var(--bs-dark)" }}>{heading}</h1>
          </div>
          {children ? <div className="d-flex align-items-center gap-2">{children}</div> : null}
        </div>
      </Col>
    </Row>
  );
};

export default PageHeading;
