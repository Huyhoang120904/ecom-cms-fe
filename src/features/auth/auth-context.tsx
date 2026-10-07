"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { restoreSession, setSessionExpiredHandler } from "lib/auth/session";

import { useMeQuery } from "./queries";
import type { MePayload } from "./types";

/**
 * The session provider.
 *
 * On mount it performs one silent refresh, which is the only way a page reload can
 * recover a session whose access token lived in memory. This is what produces the
 * three states rather than two, and `restoring` must not be collapsed into
 * `signed_out`: a signed-in seller reloading the page would be bounced to the
 * sign-in form before their cookie had a chance to be exchanged.
 */

export type AuthStatus = "restoring" | "signed_in" | "signed_out";

export interface AuthValue {
  status: AuthStatus;
  session: MePayload | null;
  can: (permission: string) => boolean;
}

/**
 * Exported so the test harness can supply a value directly and skip the silent
 * refresh, which would otherwise make every component test depend on a stubbed
 * `/auth/refresh` call it does not care about.
 */
export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("restoring");

  const me = useMeQuery(status !== "restoring");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const restored = await restoreSession();
      if (cancelled) {
        return;
      }
      setStatus(restored ? "signed_in" : "signed_out");
    })();

    // A refresh that fails later in the visit is a real session end, unlike the
    // boot-time attempt above. Drop the cached identity so the shell stops showing
    // a seller who is no longer signed in, and send them back to sign in.
    setSessionExpiredHandler(() => {
      queryClient.clear();
      setStatus("signed_out");
      void router.replace("/login");
    });

    return () => {
      cancelled = true;
      setSessionExpiredHandler(null);
    };
  }, [queryClient, router]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session: me.data ?? null,
      // Presentation only. The backend decides what is actually permitted; this
      // exists so the shell does not render a link that would 403.
      can: (permission) => me.data?.permissions.includes(permission) ?? false,
    }),
    [status, me.data],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
