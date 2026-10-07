import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, Col, Container, Row } from "react-bootstrap";
import { Layers, Lock, Shield, ShoppingBag } from "react-feather";

interface AuthLayoutProps {
  title: string;
  intro: string;
  children: ReactNode;
  /** The sign-in form links to registration and vice versa. */
  altAction: { prompt: string; label: string; href: string };
}

/**
 * Shared shell for the two public authentication pages.
 *
 * The split is deliberate rather than a centred card: the form sits in a narrower
 * column with the explanation beside it, so the seller reads what an account is
 * before committing to one. The aside carries real content only; no invented metrics
 * or placeholder logos.
 */
export default function AuthLayout({
  title,
  intro,
  children,
  altAction,
}: AuthLayoutProps) {
  return (
    <Container fluid className="px-0">
      <Row className="g-0 min-vh-100">
        <Col
          lg={5}
          md={12}
          className="bg-white d-flex align-items-center justify-content-center"
        >
          <div
            className="w-100 px-4 px-md-5 py-5"
            style={{ maxWidth: "34rem" }}
          >
            {/* Brand mark header */}
            <div className="auth-brand-badge">
              <div className="brand-icon-chip shadow-sm">
                <ShoppingBag size={20} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold fs-4 text-dark lh-1">Seller CMS</span>
                  <Badge bg="light" className="text-primary border small">
                    Merchant Portal
                  </Badge>
                </div>
                <span className="text-muted small">Ecommerce Store Administration</span>
              </div>
            </div>

            <h1 className="h3 fw-bold mb-2 text-dark">{title}</h1>
            <p className="text-muted mb-4" style={{ maxWidth: "46ch" }}>
              {intro}
            </p>

            {children}

            <div className="pt-4 mt-4 border-top">
              <p className="text-muted mb-0">
                {altAction.prompt}{" "}
                <Link
                  href={altAction.href}
                  className="fw-semibold text-primary text-decoration-none"
                >
                  {altAction.label}
                </Link>
              </p>
            </div>
          </div>
        </Col>

        <Col
          lg={7}
          md={12}
          className="d-none d-lg-flex align-items-center bg-light border-start"
        >
          <div className="px-5 py-5 mx-auto" style={{ maxWidth: "44rem" }}>
            <div className="mb-4">
              <span className="text-uppercase text-primary fw-semibold fs-6">
                Workspace Architecture
              </span>
              <h2 className="h4 fw-bold mt-1 mb-2 text-dark">
                What the workspace holds
              </h2>
              <p className="text-muted small mb-0">
                Core design principles that keep your storefront and data isolated.
              </p>
            </div>

            <div className="auth-feature-item shadow-sm">
              <div className="feature-icon-chip">
                <ShoppingBag size={18} />
              </div>
              <div>
                <span className="fw-semibold d-block text-dark">
                  One shop per account to start
                </span>
                <span className="text-muted small">
                  Registering creates your account and its first shop together, so you
                  are never left signed in with nowhere to sell.
                </span>
              </div>
            </div>

            <div className="auth-feature-item shadow-sm">
              <div className="feature-icon-chip">
                <Layers size={18} />
              </div>
              <div>
                <span className="fw-semibold d-block text-dark">
                  Catalogues and orders are scoped to the shop
                </span>
                <span className="text-muted small">
                  Switching shops changes what you can see and do, and that scope is
                  enforced by the API rather than by this interface.
                </span>
              </div>
            </div>

            <div className="auth-feature-item shadow-sm">
              <div className="feature-icon-chip">
                <Shield size={18} />
              </div>
              <div>
                <span className="fw-semibold d-block text-dark">
                  Roles decide what is editable
                </span>
                <span className="text-muted small">
                  The account that creates a shop owns it. Others you invite later can
                  be given a narrower role.
                </span>
              </div>
            </div>

            <div className="d-flex align-items-start gap-2 mt-4 p-3 bg-white rounded border text-muted small">
              <Lock size={16} className="text-primary mt-1 flex-shrink-0" />
              <span>
                Your session is held in a secure cookie and an in-memory token. Closing
                the browser does not by itself end it, so sign out on a shared machine.
              </span>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
