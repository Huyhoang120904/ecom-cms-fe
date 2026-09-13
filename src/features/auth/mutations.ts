import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { clearSession } from "lib/auth/session";

import { authKeys } from "./query-keys";
import { login, logout, register, switchShop } from "./api";

import type { LoginPayload, RegisterPayload, Session, SwitchShopPayload } from "./types";

/**
 * Invalidate every cached view of the session.
 *
 * A shop switch changes the permissions a page renders from, so the whole cache is
 * dropped rather than only the session entry: a products list fetched under the old
 * shop must not be shown as if it belonged to the new one.
 */
function useSessionSettled(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries();
  };
}

/** Sign in and adopt the returned session. */
export function useLoginMutation(): UseMutationResult<Session, Error, LoginPayload> {
  const settle = useSessionSettled();
  return useMutation({ mutationFn: login, onSuccess: settle });
}

/** Create an account and its first shop, then adopt the returned session. */
export function useRegisterMutation(): UseMutationResult<Session, Error, RegisterPayload> {
  const settle = useSessionSettled();
  return useMutation({ mutationFn: register, onSuccess: settle });
}

/** Sign out. Local state is cleared even if the request fails. */
export function useLogoutMutation(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Drop the cache first, then clear the token: a component re-rendering
      // mid-sequence must not read a session left behind in the cache.
      clearSession();
      queryClient.clear();
    },
  });
}

/** Re-scope the session to another shop. */
export function useSwitchShopMutation(): UseMutationResult<Session, Error, SwitchShopPayload> {
  const settle = useSessionSettled();
  return useMutation({ mutationFn: switchShop, onSuccess: settle });
}
