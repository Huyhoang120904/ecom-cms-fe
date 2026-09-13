import type { ReactNode } from "react";
import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { useAuth } from "features/auth/auth-context";
import { useLogoutMutation, useSwitchShopMutation } from "features/auth/mutations";

import AccountMenu from "./account-menu";
import ShellNavigation from "./shell-navigation";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Seller CMS shell.
 *
 * Owns the header, the capability navigation, and the content region. The account
 * area renders the real signed-in seller, or nothing at all while the session is
 * unresolved, so the shell never shows a placeholder identity.
 */
export default function AppShell({ children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session } = useAuth();
  const logout = useLogoutMutation();
  const switchShop = useSwitchShopMutation();

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="border-bottom bg-white">
        <Container fluid className="px-4 py-3">
          <Row className="align-items-center g-2 flex-nowrap">
            <Col xs="auto">
              <span className="fw-bold">Seller CMS</span>
            </Col>

            <Col className="d-none d-md-block">
              <ShellNavigation />
            </Col>

            <Col xs="auto" className="ms-auto d-none d-md-flex align-items-center gap-2">
              <AccountMenu
                onSwitchShop={(shopId) => switchShop.mutate({ shop_id: shopId })}
              />
              <button
                type="button"
                className="btn btn-link btn-sm text-muted text-decoration-none p-1"
                disabled={logout.isPending}
                onClick={() => logout.mutate()}
              >
                {logout.isPending ? "Signing out" : "Sign out"}
              </button>
            </Col>

            <Col xs="auto" className="ms-auto d-md-none">
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
            <div id="seller-menu" className="d-md-none pt-3">
              <ShellNavigation stacked onNavigate={() => setMenuOpen(false)} />
              <div className="pt-2 border-top mt-2">
                {session ? (
                  <p className="small text-muted mb-2">
                    {session.user.email} on {session.active_shop.name}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  {logout.isPending ? "Signing out" : "Sign out"}
                </button>
              </div>
            </div>
          ) : null}
        </Container>
      </header>

      <main className="flex-grow-1 bg-light">{children}</main>
    </div>
  );
}
