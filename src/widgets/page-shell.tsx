import type { ReactNode } from "react";

import PageHeading from "widgets/page-heading";

interface PageShellProps {
  title: string;
  /** Row of page-level actions (primary button, export, status badge). */
  actions?: ReactNode;
  /** Statistics row rendered under the heading; compose with `Row`/`Col`. */
  stats?: ReactNode;
  children: ReactNode;
}

/** The standard listing page frame: gutters, heading, optional stats, content. */
export default function PageShell({ title, actions, stats, children }: PageShellProps) {
  return (
    <div className="container-fluid p-3 p-md-4 shopee-page">
      <PageHeading heading={title}>{actions}</PageHeading>
      {stats ? <div className="mb-4">{stats}</div> : null}
      {children}
    </div>
  );
}
