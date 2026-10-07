import { ChevronLeft, ChevronRight } from "react-feather";

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Chevron button that collapses / expands the sidebar.
 *
 * Sits at the bottom of the sidebar brand area. The icon direction follows the
 * action: left-chevron collapses (pushes the sidebar toward the edge),
 * right-chevron expands.
 */
export default function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  const Icon = collapsed ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      className="btn btn-link btn-sm text-muted p-1 sidebar-toggle-btn"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={onToggle}
    >
      <Icon size={18} />
    </button>
  );
}
