import type { ReactNode } from "react";

import { ProtectedRouteGuard } from "app/session/route-guard";
import AppShell from "app/shell/app-shell";

export default function CmsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ProtectedRouteGuard>
      <AppShell>{children}</AppShell>
    </ProtectedRouteGuard>
  );
}
