import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { clearSession } from "lib/auth/session";

import { authKeys } from "./query-keys";
import {
  deactivateAccount,
  deleteAvatar,
  login,
  logout,
  register,
  switchShop,
  updateProfile,
  uploadAvatar,
} from "./api";

import type {
  DeactivatePayload,
  LoginPayload,
  Me,
  ProfileUpdatePayload,
  RegisterPayload,
  Session,
  SwitchShopPayload,
} from "./types";

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

/** Re-seed the cached identity from a mutation that returned it. */
function useSeedMe(): (me: Me) => void {
  const queryClient = useQueryClient();
  return (me: Me) => {
    queryClient.setQueryData(authKeys.me(), me);
  };
}

/** Save the profile. Only the changed fields are sent. */
export function useUpdateProfileMutation(): UseMutationResult<Me, Error, ProfileUpdatePayload> {
  const seed = useSeedMe();
  return useMutation({ mutationFn: updateProfile, onSuccess: seed });
}

/** Replace the avatar. */
export function useUploadAvatarMutation(): UseMutationResult<Me, Error, File> {
  const seed = useSeedMe();
  return useMutation({ mutationFn: uploadAvatar, onSuccess: seed });
}

/** Remove the avatar, reverting the account to its monogram. */
export function useDeleteAvatarMutation(): UseMutationResult<Me, Error, void> {
  const queryClient = useQueryClient();
  const seed = useSeedMe();
  return useMutation({
    mutationFn: async () => {
      await deleteAvatar();
      // The delete answers 204, so the fresh identity is re-fetched rather than
      // guessed: the server decides what `avatar_url` becomes.
      const { fetchMe } = await import("./api");
      return fetchMe();
    },
    onSuccess: (me) => {
      seed(me);
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

/**
 * Deactivate the account. One-way, so on success the seller is signed out and the
 * whole cache is dropped rather than refreshed.
 */
export function useDeactivateMutation(): UseMutationResult<void, Error, DeactivatePayload> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateAccount,
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
