import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Placeholder } from "react-bootstrap";

import { useAuth } from "features/auth/auth-context";

/**
 * Paths a signed-out visitor may see. Everything else requires a session.
 *
 * `/404` is included because Next renders it for an unknown URL, and redirecting
 * from a 404 would turn a typo into a sign-in prompt.
 */
const PUBLIC_ROUTES = new Set(["/login", "/register", "/404"]);

/**
 * Hold the layout until the seller's session is known, then act on it.
 *
 * Two rules, and the order matters for both:
 *
 * 1. `/login` and `/register` are public. A signed-in seller who opens one is sent
 *    to the dashboard rather than shown a form to sign in again.
 * 2. Every other path needs a session.
 *
 * The skeleton is rendered for `restoring` on every path, public included, because
 * `/login` also has to know whether to redirect away, and rendering the form first
 * would flash it at a seller who is already signed in.
 *
 * This is a convenience, not a security boundary. Every guarded call is authorized
 * by the backend, which is the only place that can enforce anything.
 */
export default function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  const isPublic = PUBLIC_ROUTES.has(router.pathname);

  useEffect(() => {
    if (status === "restoring") {
      return;
    }
    if (status === "signed_out" && !isPublic) {
      // `next` lets the sign-in form return the seller to where they were.
      void router.replace({ pathname: "/login", query: { next: router.asPath } });
      return;
    }
    if (status === "signed_in" && isPublic) {
      void router.replace("/");
    }
  }, [status, isPublic, router]);

  if (status === "restoring") {
    return <SessionSkeleton />;
  }

  if (status === "signed_out" && !isPublic) {
    return <SessionSkeleton />;
  }

  if (status === "signed_in" && isPublic) {
    return <SessionSkeleton />;
  }

  return <>{children}</>;
}

/**
 * A placeholder shaped like the shell, so resolving the session does not shift the
 * layout once content arrives.
 */
function SessionSkeleton() {
  return (
    <div className="d-flex flex-column min-vh-100" role="status" aria-live="polite">
      <span className="visually-hidden">Checking your session</span>
      <div className="border-bottom bg-white">
        <div className="container-fluid px-6 py-3">
          <Placeholder as="div" animation="glow" className="mb-0">
            <Placeholder xs={3} />
          </Placeholder>
        </div>
      </div>
      <div className="flex-grow-1 bg-light">
        <div className="container px-4 py-4">
          <Placeholder as="div" animation="glow" className="mb-3">
            <Placeholder xs={4} size="lg" />
          </Placeholder>
          <Placeholder as="div" animation="glow" className="mb-2">
            <Placeholder xs={12} />
          </Placeholder>
          <Placeholder as="div" animation="glow">
            <Placeholder xs={8} />
          </Placeholder>
        </div>
      </div>
    </div>
  );
}
