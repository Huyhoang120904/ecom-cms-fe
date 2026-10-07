"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "features/auth/auth-context";

import { isActive, visibleNavigationItems } from "./navigation";

interface ShellNavigationProps {
  /** When true the sidebar is collapsed and only icons are shown. */
  collapsed?: boolean;
  /** Called after a link is followed, so the mobile menu can close itself. */
  onNavigate?: () => void;
}

/**
 * The capability navigation rendered inside the sidebar.
 *
 * Items are filtered by the permissions the session reports. This is presentation
 * only: hiding a link keeps the shell from offering a page that would fail, and the
 * backend still refuses the request if the link is reached some other way.
 */
export default function ShellNavigation({
  collapsed = false,
  onNavigate,
}: ShellNavigationProps) {
  const pathname = usePathname() ?? "/";
  const { can } = useAuth();

  const items = visibleNavigationItems(can);
  const sections = Array.from(new Set(items.map((item) => item.section ?? "Shop Management")));

  return (
    <nav aria-label="Seller Centre">
      {sections.map((section) => (
        <div key={section}>
          {collapsed ? null : <div className="nav-section-label">{section}</div>}
          <ul className="navbar-nav flex-column">
            {items.filter((item) => (item.section ?? "Shop Management") === section).map((item) => {
              const Icon = item.icon;
              const active = isActive(item, pathname);
              return (
                <li className="nav-item" key={item.key}>
                  <Link
                    href={item.href}
                    className={`nav-link d-flex align-items-center gap-2${active ? " active" : ""}`}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <span className="nav-icon" aria-hidden="true"><Icon size={18} /></span>
                    {collapsed ? null : <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
