import { useCallback, useState } from "react";

const STORAGE_KEY = "cms-sidebar-collapsed";

function readStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export interface SidebarCollapseState {
  collapsed: boolean;
  toggle: () => void;
}

/**
 * Sidebar expanded / collapsed state with localStorage persistence.
 *
 * The hook reads localStorage on mount and writes it on every toggle so the
 * choice survives a page refresh. An unreadable or missing value falls back to
 * expanded.
 */
export function useSidebarCollapse(): SidebarCollapseState {
  const [collapsed, setCollapsed] = useState(readStorage);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Storage full or disabled — the toggle still works in-memory.
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
