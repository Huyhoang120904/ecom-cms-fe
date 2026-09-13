import { Row, Col } from "react-bootstrap";

interface PageHeadingProps {
  heading: string;
}

const PageHeading = ({ heading }: PageHeadingProps) => {
  return (
    <Row>
      <Col lg={12} md={12} xs={12}>
        <div className="border-bottom pb-4 mb-4">
          <h3 className="mb-0 fw-bold">{heading}</h3>
        </div>
      </Col>
    </Row>
  );
};

export default PageHeading;
