import { Dropdown } from "react-bootstrap";

import { useAuth } from "features/auth/auth-context";
import Avatar from "features/auth/components/avatar";
import type { Membership } from "features/auth/types";

interface ShopSwitcherProps {
  memberships: Membership[];
  activeShopId: string | undefined;
  onSwitchShop: (shopId: string) => void;
  isPending: boolean;
}

/**
 * Switch the shop the session is scoped to.
 *
 * Rendered only when the account belongs to more than one shop: a control that can
 * only ever select the current value is noise. A switch re-issues the access token
 * and the refresh cookie, so it is treated as a pending operation rather than an
 * instant toggle.
 */
export function ShopSwitcher({
  memberships,
  activeShopId,
  onSwitchShop,
  isPending,
}: ShopSwitcherProps) {
  if (memberships.length < 2) {
    return null;
  }

  return (
    <Dropdown.ItemText className="px-3 py-2 border-bottom">
      <span className="text-muted small d-block mb-2" id="switch-shop-label">
        Switch shop
      </span>
      <ul className="list-unstyled mb-0" aria-labelledby="switch-shop-label">
        {memberships.map((membership) => {
          const active = membership.shop.id === activeShopId;
          return (
            <li key={membership.shop.id}>
              <button
                type="button"
                className="btn btn-sm w-100 text-start px-2 py-1"
                disabled={active || isPending}
                aria-current={active ? "true" : undefined}
                onClick={() => onSwitchShop(membership.shop.id)}
              >
                <span className="d-block">{membership.shop.name}</span>
                <span className="text-muted small">
                  {membership.role.name}
                  {active ? " (current)" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Dropdown.ItemText>
  );
}

interface AccountMenuProps {
  /** Supplied by a test to observe the choice; the shell omits it. */
  onSwitchShop?: (shopId: string) => void;
}

/** The signed-in seller's account control in the shell header. */
export function AccountMenu({ onSwitchShop }: AccountMenuProps) {
  const { session, can } = useAuth();

  // The shell only renders inside the guard, but a missing session is still typed
  // as possible, and rendering a menu of nothing would be worse than nothing.
  if (!session) {
    return null;
  }

  const { user, active_shop: activeShop, memberships, permissions, is_platform_admin: isPlatformAdmin } = session;

  return (
    <Dropdown align="end" className="account-menu">
      <Dropdown.Toggle
        variant="link"
        id="account-menu"
        className="d-flex align-items-center gap-2 text-decoration-none text-body p-1"
      >
        <Avatar user={user} size={32} />
        <span className="d-none d-lg-inline text-start">
          <span className="d-block small fw-medium">{user.full_name}</span>
          {activeShop ? (
            <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>
              {activeShop.name}
            </span>
          ) : null}
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="shadow-sm" style={{ minWidth: "16rem" }}>
        <Dropdown.ItemText className="px-3 py-2">
          <span className="d-block fw-medium">{user.full_name}</span>
          <span className="d-block text-muted small">{user.email}</span>
          {isPlatformAdmin ? (
            <span className="badge-status badge-status-secondary mt-1">
              <span className="badge-dot bg-dark" />
              Platform administrator
            </span>
          ) : null}
        </Dropdown.ItemText>

        {activeShop ? (
          <ShopSwitcher
            memberships={memberships}
            activeShopId={activeShop.id}
            onSwitchShop={onSwitchShop ?? (() => {})}
            isPending={false}
          />
        ) : null}

        <Dropdown.Divider />

        <Dropdown.Item href="/profile">Profile</Dropdown.Item>
        {activeShop && can("shop:update") ? (
          <Dropdown.Item href="/shop">Shop settings</Dropdown.Item>
        ) : null}

        {activeShop ? (
          <>
            <Dropdown.Divider />
            <Dropdown.ItemText className="px-3 py-2 text-muted small">
              {permissions.length} permissions on {activeShop.name}
            </Dropdown.ItemText>
          </>
        ) : null}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default AccountMenu;
