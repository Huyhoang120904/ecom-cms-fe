import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Col, Container, Row } from "react-bootstrap";

import { navigationItems, type NavigationItem } from "app/shell/navigation";

interface AppShellProps {
  children: ReactNode;
}

function isActive(item: NavigationItem, pathname: string): boolean {
  return item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
}

/**
 * Seller CMS shell.
 *
 * Owns the header, the capability navigation, and the content region. The
 * account area shows a signed-out placeholder because there is no identity
 * provider yet — no fake account is rendered.
 */
export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="border-bottom bg-white">
        <Container fluid className="px-6 py-3">
          <Row className="align-items-center g-2">
            <Col xs="auto">
              <span className="fw-bold">Seller CMS</span>
            </Col>

            <Col className="d-none d-md-block">
              <nav aria-label="Seller capabilities">
                <ul className="nav">
                  {navigationItems.map((item) => (
                    <li className="nav-item" key={item.key}>
                      <Link
                        href={item.href}
                        className={`nav-link${
                          isActive(item, router.pathname) ? " active" : ""
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Col>

            <Col xs="auto" className="ms-auto text-muted small d-none d-md-block">
              Not signed in
            </Col>

            <Col xs="auto" className="d-md-none">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                aria-expanded={menuOpen}
                aria-controls="seller-menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                Menu
              </button>
            </Col>
          </Row>

          {menuOpen ? (
            <nav id="seller-menu" aria-label="Seller capabilities" className="d-md-none pt-3">
              <ul className="nav flex-column">
                {navigationItems.map((item) => (
                  <li className="nav-item" key={item.key}>
                    <Link
                      href={item.href}
                      className={`nav-link${
                        isActive(item, router.pathname) ? " active" : ""
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </Container>
      </header>

      <main className="flex-grow-1 bg-light">{children}</main>
    </div>
  );
}
