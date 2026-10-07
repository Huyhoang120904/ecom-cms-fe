"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import SimpleBar from "simplebar-react";
import { Alert, Button, Card } from "react-bootstrap";
import { Bell, HelpCircle, Menu, Shield, X } from "react-feather";

import { useAuth } from "features/auth/auth-context";
import { useLogoutMutation, useSwitchShopMutation } from "features/auth/mutations";
import type { MePayload } from "features/auth/types";

import AccountMenu from "./account-menu";
import ShellNavigation from "./shell-navigation";
import SidebarToggle from "./sidebar-toggle";
import { useSidebarCollapse } from "./use-sidebar-collapse";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Why this session cannot use the seller CMS, or `null` when it can.
 *
 * The backend decides this, not the shell: a token is minted for one perimeter
 * (`storefront`, `cms`, `admin`) and the shop routes refuse anything that is not `cms` with
 * a shop scope. Rendering the navigation anyway would offer a seller links that every
 * request turns into a `403`, so the shell states the situation instead.
 */
function unusableSessionReason(session: MePayload): string | null {
  if (session.audience === "storefront") {
    return "This browser is signed in as a buyer, not as a seller. A buyer session has no shop scope, so the seller CMS cannot show products, orders, or settings for it.";
  }
  if (session.audience === "admin") {
    return "This browser is signed in as a platform administrator. Platform administration is not part of this app yet, and an administrator session carries no shop.";
  }
  if (session.active_shop === null) {
    return "This session has no active shop. Either your membership was removed, or the shop is suspended, so nothing in this shop can be shown.";
  }
  return null;
}

/**
 * Shopee Seller Centre shell.
 *
 * White 56px topbar (shop identity + search + help/bell + account),
 * white 224px sidebar with grouped nav, #F6F6F6 page surface.
 * Sidebar collapses to icon rail on desktop; overlay drawer on mobile.
 */
export default function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebarCollapse();
  const { session } = useAuth();
  const logout = useLogoutMutation();
  const switchShop = useSwitchShopMutation();

  const unusable = session ? unusableSessionReason(session) : null;

  if (session && unusable) {
    return (
      <div className="d-flex align-items-center justify-content-center p-4" style={{ minHeight: "100vh" }}>
        <Card className="border-0 shadow-sm" style={{ maxWidth: "32rem" }}>
          <Card.Body className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Shield size={20} aria-hidden="true" />
              <h1 className="h5 fw-bold mb-0">Not a seller session</h1>
            </div>

            <Alert variant="secondary" role="status" className="mb-3">
              {unusable}
            </Alert>

            <p className="text-muted small mb-4">
              You are signed in as {session.user.full_name} ({session.user.email}).
            </p>

            <div className="d-flex gap-2">
              <Button
                type="button"
                variant="primary"
                disabled={logout.isPending}
                aria-busy={logout.isPending}
                onClick={() => logout.mutate()}
              >
                {logout.isPending ? "Signing out..." : "Sign out and use a seller account"}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const shopName = session?.active_shop?.name ?? "Seller Centre";

  return (
    <div
      id="db-wrapper"
      className={`${collapsed ? "sidebar-collapsed" : ""}${mobileOpen ? " sidebar-mobile-open" : ""}`}
    >
      {/* ─── Sidebar ─── */}
      <nav className="navbar-vertical navbar" aria-label="Sidebar">
        <SimpleBar style={{ height: "100%", maxHeight: "100%" }}>
          {/* Brand */}
          <div className="navbar-brand-box d-flex align-items-center justify-content-between px-3 py-2">
            {collapsed ? (
              <span className="shopee-brand" aria-label="Seller Centre">
                <span className="shopee-brand-mark" aria-hidden="true">S</span>
              </span>
            ) : (
              <span className="shopee-brand">
                <span className="shopee-brand-mark" aria-hidden="true">S</span>
                <span className="shopee-brand-name">
                  <strong>Seller Centre</strong>
                  <span>{shopName}</span>
                </span>
              </span>
            )}
            <SidebarToggle collapsed={collapsed} onToggle={toggle} />
          </div>

          {/* Navigation links */}
          <ShellNavigation collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />

          {/* Footer help */}
          {collapsed ? null : (
            <div className="px-3 py-3 mt-2">
              <div className="d-flex align-items-center gap-2 text-muted small">
                <HelpCircle size={15} aria-hidden="true" />
                <span>Seller help &amp; guides in Shop Settings</span>
              </div>
            </div>
          )}
        </SimpleBar>
      </nav>

      {/* Mobile overlay backdrop: a real button so it is keyboard reachable */}
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* ─── Page content ─── */}
      <div id="page-content">
        {/* Shopee topbar: toggle + shop + search + actions */}
        <header className="shopee-topbar">
          <div className="d-flex align-items-center gap-2 px-3 py-2">
            <button
              type="button"
              className="shopee-icon-btn d-md-none"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="d-none d-md-flex align-items-center gap-2 me-1">
              <span className="fw-semibold small text-dark">{shopName}</span>
              {session?.active_shop ? (
                <span className="badge-status badge-status-success">
                  <span className="badge-dot bg-success" />
                  Active
                </span>
              ) : null}
            </div>

            <form
              role="search"
              className="shopee-search d-none d-sm-block ms-md-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="shell-search" className="visually-hidden">
                Search orders, products
              </label>
              <input
                id="shell-search"
                type="search"
                className="form-control form-control-sm"
                placeholder="Search orders, products…"
                autoComplete="off"
              />
            </form>

            <div className="ms-auto d-flex align-items-center gap-1 header-account">
              <button type="button" className="shopee-icon-btn" aria-label="Notifications">
                <Bell size={19} />
              </button>
              <button type="button" className="shopee-icon-btn d-none d-sm-inline-flex" aria-label="Help">
                <HelpCircle size={19} />
              </button>
              {session ? (
                <AccountMenu
                  onSwitchShop={(shopId) => switchShop.mutate({ shop_id: shopId })}
                />
              ) : null}
              {session ? (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-muted text-decoration-none px-2"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="shopee-page" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
