import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteProductImage,
  deleteVariant,
  moveProductImage,
  publishProduct,
  unpublishProduct,
  updateProduct,
  updateVariant,
  uploadProductImage,
} from "./api";
import { productDetailOptions, productsKeys } from "./queries";
import type {
  Product,
  ProductCreatePayload,
  ProductUpdatePayload,
  VariantUpdatePayload,
  VariantCreatePayload,
  ProductImage,
} from "./types";

/**
 * Read/write helpers over one product's detail cache.
 *
 * Every mutation below needs the same four moves — cancel the in-flight detail read,
 * snapshot it, write the optimistic value, roll back on failure — so they live in one
 * place instead of being spelled out (and spelled out differently) eight times.
 */
function useDetailCache(productId: string) {
  const queryClient = useQueryClient();
  const key = productDetailOptions(productId).queryKey;

  return {
    key,
    read: () => queryClient.getQueryData<Product>(key),
    write: (product: Product) => queryClient.setQueryData<Product>(key, product),
    cancel: () => queryClient.cancelQueries({ queryKey: key }),
    /** Re-read the server's own copy: it is the authority on every derived field. */
    refresh: () => queryClient.invalidateQueries({ queryKey: key }),
    forget: () => queryClient.removeQueries({ queryKey: key }),
    refreshList: () => queryClient.invalidateQueries({ queryKey: productsKeys.all }),
  };
}

/**
 * Create a product. It always starts `draft`.
 *
 * Nothing is optimistically inserted into the list: the server assigns the id, the
 * timestamps and the default status, and a row with invented values would be a lie the
 * seller cannot tell apart from a saved one.
 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductCreatePayload) => createProduct(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}

/** Edit a product's own fields and attribute values. */
export function useUpdateProductMutation(productId: string) {
  const cache = useDetailCache(productId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductUpdatePayload) => updateProduct(productId, payload),
    onSuccess: (product) => {
      // The response is the whole product, so the detail view needs no refetch.
      queryClient.setQueryData(cache.key, product);
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}

/**
 * Soft-delete a product.
 *
 * The cached detail is dropped on success rather than refetched: the row is gone, and a
 * refetch of a deleted product would only produce the `404` the seller just caused.
 */
export function useDeleteProductMutation(productId: string) {
  const cache = useDetailCache(productId);
  return useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: () => {
      cache.forget();
      void cache.refreshList();
    },
  });
}

/**
 * Move a product to `active` or back to `inactive`.
 *
 * The status is flipped optimistically — the switch should move under the seller's hand —
 * and a refusal (missing attributes, no active variant, an illegal transition) rolls the
 * cached product back and surfaces the backend's message.
 */
function useStatusMutation(
  productId: string,
  run: (id: string) => Promise<Product>,
  nextStatus: Product["status"],
) {
  const cache = useDetailCache(productId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => run(productId),
    onMutate: async () => {
      await cache.cancel();
      const previous = cache.read();
      if (previous) cache.write({ ...previous, status: nextStatus });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cache.key, context.previous);
      }
    },
    onSuccess: (product) => {
      queryClient.setQueryData(cache.key, product);
    },
    onSettled: () => {
      void cache.refreshList();
    },
  });
}

export function usePublishProductMutation(productId: string) {
  return useStatusMutation(productId, publishProduct, "active");
}

export function useUnpublishProductMutation(productId: string) {
  return useStatusMutation(productId, unpublishProduct, "inactive");
}

export type BulkStatusAction = "publish" | "unpublish";

export interface BulkStatusResult {
  id: string;
  ok: boolean;
  message?: string;
}

/**
 * Publish or unpublish many products at once.
 *
 * One settled result per id, in input order: a refusal for one row never cancels the
 * rest, and the caller decides what the summary says. The list is invalidated once,
 * after every request settles, because per-row optimistic writes would fight each other.
 */
export function useBulkProductStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      action,
    }: {
      ids: string[];
      action: BulkStatusAction;
    }): Promise<BulkStatusResult[]> => {
      const run = action === "publish" ? publishProduct : unpublishProduct;
      const settled = await Promise.allSettled(ids.map((id) => run(id)));
      return settled.map((result, index) => {
        const id = ids[index] ?? "";
        if (result.status === "fulfilled") return { id, ok: true };
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : "The product could not be updated.";
        return { id, ok: false, message };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/**
 * Add one variant (one row of the variation matrix) to a product.
 *
 * `options` is fixed at creation, which is why the contract refuses to `PATCH` them: a
 * different combination is a different variant.
 */
export function useCreateVariantMutation(productId: string) {
  const cache = useDetailCache(productId);
  return useMutation({
    mutationFn: (payload: VariantCreatePayload) => createVariant(productId, payload),
    onSuccess: () => {
      void cache.refresh();
    },
  });
}

/**
 * Edit a saved variant's SKU, price, stock, or status.
 *
 * This is the field a seller touches most often and the one where a round trip is most
 * visible, so the row is patched optimistically and rolled back to the snapshot when the
 * server refuses (a duplicate SKU, or deactivating the last active variant of a product
 * that is on sale).
 */
export function useUpdateVariantMutation(productId: string) {
  const cache = useDetailCache(productId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: string;
      payload: VariantUpdatePayload;
    }) => updateVariant(productId, variantId, payload),
    onMutate: async ({ variantId, payload }) => {
      await cache.cancel();
      const previous = cache.read();
      if (previous) {
        cache.write({
          ...previous,
          variants: previous.variants.map((variant) =>
            variant.id === variantId ? { ...variant, ...payload } : variant,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cache.key, context.previous);
      }
    },
    onSuccess: (variant) => {
      // Adopt the server's copy: it is what the next read would return.
      const current = cache.read();
      if (current) {
        cache.write({
          ...current,
          variants: current.variants.map((row) => (row.id === variant.id ? variant : row)),
        });
      }
    },
  });
}

export function useDeleteVariantMutation(productId: string) {
  const cache = useDetailCache(productId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(productId, variantId),
    onMutate: async (variantId) => {
      await cache.cancel();
      const previous = cache.read();
      if (previous) {
        cache.write({
          ...previous,
          variants: previous.variants.filter((variant) => variant.id !== variantId),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cache.key, context.previous);
      }
    },
    onSettled: () => {
      void cache.refresh();
    },
  });
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Upload an image into a scope: the product itself, or one of its variants.
 *
 * No optimistic placeholder is inserted. The server assigns the id, the position, and the
 * `url` — derived from a digest it computes — so a local row would show either a broken
 * thumbnail or the seller's own file under a URL the backend never issued.
 */
export function useUploadProductImageMutation(productId: string) {
  const cache = useDetailCache(productId);
  return useMutation({
    mutationFn: ({ file, variantId }: { file: File; variantId?: string }) =>
      uploadProductImage(productId, file, variantId),
    onSettled: () => {
      void cache.refresh();
    },
  });
}

/**
 * Reorder an image within its scope.
 *
 * The response is the whole scope in its new order, so it replaces that scope in the
 * cache. No refetch and no skeleton: the gallery the seller just rearranged stays put.
 */
export function useMoveProductImageMutation(productId: string) {
  const cache = useDetailCache(productId);

  return useMutation({
    mutationFn: ({ imageId, position }: { imageId: string; position: number }) =>
      moveProductImage(productId, imageId, position),
    onSuccess: (scope) => {
      const current = cache.read();
      if (!current) return;
      cache.write({ ...current, images: replaceScope(current.images, scope) });
    },
  });
}

export function useDeleteProductImageMutation(productId: string) {
  const cache = useDetailCache(productId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(productId, imageId),
    onMutate: async (imageId) => {
      await cache.cancel();
      const previous = cache.read();
      if (!previous) return { previous: undefined };
      cache.write({
        ...previous,
        images: previous.images.filter((image) => image.id !== imageId),
        variants: previous.variants.map((variant) => ({
          ...variant,
          images: variant.images.filter((image) => image.id !== imageId),
        })),
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cache.key, context.previous);
      }
    },
    onSettled: () => {
      void cache.refresh();
    },
  });
}

/**
 * Swap one image scope for the server's reordered copy, leaving every other scope alone.
 *
 * An image belongs either to the product (`variant_id === null`) or to one variant, and a
 * move only reorders inside that single scope. Replacing the whole `images` array with the
 * response would silently drop every other scope's images.
 */
function replaceScope(images: ProductImage[], scope: ProductImage[]): ProductImage[] {
  const scopeVariantId = scope[0]?.variant_id ?? null;
  const kept = images.filter((image) => image.variant_id !== scopeVariantId);
  return [...kept, ...scope];
}