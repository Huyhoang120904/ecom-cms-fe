import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { authKeys } from "features/auth/query-keys";
import type { Shop, ShopUpdatePayload, DeleteShopPayload } from "features/auth/types";

import { deleteShop, deleteShopBackground, updateShop, uploadShopBackground } from "./api";

/**
 * Refresh the cached identity after a shop write.
 *
 * The active shop is carried in the `me` payload, so a shop change is a session
 * change: updating one key keeps the shell and the settings screen in agreement.
 */
function useRefreshSession(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: authKeys.me() });
  };
}

export function useUpdateShopMutation(): UseMutationResult<Shop, Error, ShopUpdatePayload> {
  const refresh = useRefreshSession();
  return useMutation({ mutationFn: updateShop, onSuccess: refresh });
}

export function useUploadShopBackgroundMutation(): UseMutationResult<Shop, Error, File> {
  const refresh = useRefreshSession();
  return useMutation({ mutationFn: uploadShopBackground, onSuccess: refresh });
}

export function useDeleteShopBackgroundMutation(): UseMutationResult<void, Error, void> {
  const refresh = useRefreshSession();
  return useMutation({
    mutationFn: deleteShopBackground,
    onSettled: refresh,
  });
}

/**
 * Retire the active shop.
 *
 * The session is scoped to it, so it is no longer usable afterwards; the caller
 * signs out rather than refreshing.
 */
export function useDeleteShopMutation(): UseMutationResult<void, Error, DeleteShopPayload> {
  return useMutation({ mutationFn: deleteShop });
}
