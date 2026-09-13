import Link from "next/link";
import { useRouter } from "next/router";

import { useAuth } from "features/auth/auth-context";

import { visibleNavigationItems, type NavigationItem } from "./navigation";

interface ShellNavigationProps {
  /** Collapses the list to a stacked layout inside the mobile menu. */
  stacked?: boolean;
  /** Called after a link is followed, so the mobile menu can close itself. */
  onNavigate?: () => void;
}

function isActive(item: NavigationItem, pathname: string): boolean {
  return item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
}

/**
 * The capability navigation.
 *
 * Items are filtered by the permissions the session reports. This is presentation
 * only: hiding a link keeps the shell from offering a page that would fail, and the
 * backend still refuses the request if the link is reached some other way.
 */
export default function ShellNavigation({ stacked = false, onNavigate }: ShellNavigationProps) {
  const router = useRouter();
  const { can } = useAuth();

  const items = visibleNavigationItems(can);

  return (
    <nav aria-label="Seller capabilities">
      <ul className={stacked ? "nav flex-column" : "nav"}>
        {items.map((item) => (
          <li className="nav-item" key={item.key}>
            <Link
              href={item.href}
              className={`nav-link${isActive(item, router.pathname) ? " active" : ""}`}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
