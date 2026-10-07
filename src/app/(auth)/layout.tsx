import type { ReactNode } from "react";

import { PublicRouteGuard } from "app/session/route-guard";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PublicRouteGuard>{children}</PublicRouteGuard>;
}
