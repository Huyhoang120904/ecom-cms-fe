import type { ReactNode } from "react";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

interface AuthLayoutProps {
  title: string;
  intro: string;
  children: ReactNode;
  /** The sign-in form links to registration and vice versa. */
  altAction: { prompt: string; label: string; href: string };
}

/**
 * Shared shell for the two public pages.
 *
 * The split is deliberate rather than a centred card: the form sits in a narrower
 * column with the explanation beside it, so the seller reads what an account is
 * before committing to one. The aside carries real content only. No testimonial, no
 * logo wall, and no metric is invented to fill the space.
 */
export default function AuthLayout({ title, intro, children, altAction }: AuthLayoutProps) {
  return (
    <Container fluid className="px-0">
      <Row className="g-0 min-vh-100">
        <Col lg={5} md={12} className="bg-white d-flex align-items-center">
          <div className="w-100 px-4 px-md-5 py-5">
            <div className="mb-5">
              <span className="fw-bold">Seller CMS</span>
            </div>

            <h1 className="h3 fw-bold mb-2">{title}</h1>
            <p className="text-muted mb-5" style={{ maxWidth: "46ch" }}>
              {intro}
            </p>

            {children}

            <p className="text-muted mt-5 mb-0">
              {altAction.prompt}{" "}
              <Link href={altAction.href} className="fw-medium">
                {altAction.label}
              </Link>
            </p>
          </div>
        </Col>

        <Col
          lg={7}
          md={12}
          className="d-none d-lg-flex align-items-center bg-light border-start"
        >
          <div className="px-5 py-5">
            <h2 className="h5 fw-bold mb-4">What the workspace holds</h2>

            <ul className="list-unstyled mb-4">
              <li className="mb-3">
                <span className="fw-medium d-block">One shop per account to start</span>
                <span className="text-muted">
                  Registering creates your account and its first shop together, so you
                  are never left signed in with nowhere to sell.
                </span>
              </li>
              <li className="mb-3">
                <span className="fw-medium d-block">Catalogues and orders are scoped to the shop</span>
                <span className="text-muted">
                  Switching shops changes what you can see and do, and that scope is
                  enforced by the API rather than by this interface.
                </span>
              </li>
              <li className="mb-3">
                <span className="fw-medium d-block">Roles decide what is editable</span>
                <span className="text-muted">
                  The account that creates a shop owns it. Others you invite later can
                  be given a narrower role.
                </span>
              </li>
            </ul>

            <p className="text-muted small mb-0" style={{ maxWidth: "60ch" }}>
              Your session is held in a secure cookie and an in-memory token. Closing
              the browser does not by itself end it, so sign out on a shared machine.
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
