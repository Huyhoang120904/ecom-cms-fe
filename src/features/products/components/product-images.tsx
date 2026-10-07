"use client";

import { useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Trash2, Upload } from "react-feather";

import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_FIT_LABEL,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_LABEL,
} from "features/products/constants";
import {
  productImageSlots,
  productImages,
  variantImageSlots,
  variantImages,
} from "features/products/mapping";
import {
  useDeleteProductImageMutation,
  useMoveProductImageMutation,
  useUploadProductImageMutation,
} from "features/products/mutations";
import type { ProductImage } from "features/products/types";

interface ProductImagesProps {
  productId: string;
  /** The product's own images, or one variant's: the scope decides the cap and the order. */
  variantId?: string;
  images: ProductImage[];
  canWrite: boolean;
}

/**
 * The gallery for one image scope.
 *
 * The cap is the contract's own (nine for the product, five per variant) counted from the
 * scope's images, so the interface cannot offer an upload the backend would refuse with
 * `409 image_limit_reached`.
 *
 * Images are plain `<img>` elements: the backend already serves a downscaled, re-encoded
 * WebP behind a digest-versioned URL, so the Next image optimizer would re-encode an
 * already-optimized asset.
 */
export default function ProductImages({
  productId,
  variantId,
  images,
  canWrite,
}: ProductImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const upload = useUploadProductImageMutation(productId);
  const move = useMoveProductImageMutation(productId);
  const remove = useDeleteProductImageMutation(productId);

  const scope = variantId ? variantImages(images, variantId) : productImages(images);
  const slots = variantId ? variantImageSlots(images, variantId) : productImageSlots(images);
  const pending = upload.isPending || move.isPending || remove.isPending;

  const reset = (): void => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    // Checked here so the seller learns immediately instead of after a round trip. The
    // backend checks again and is the authority.
    if (file.size > IMAGE_MAX_BYTES) {
      setLocalError(`That image is larger than ${IMAGE_MAX_LABEL}. Choose a smaller one.`);
      reset();
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setLocalError("Use a PNG, JPEG, or WebP image.");
      reset();
      return;
    }

    upload.mutate({ file, variantId }, { onSettled: reset });
  };

  const failure = upload.error ?? move.error ?? remove.error;
  const error = localError ?? failure?.message ?? null;

  return (
    <div>
      {scope.length === 0 ? (
        <p className="text-muted small mb-3">
          No images yet. The first image is the one buyers see first.
        </p>
      ) : (
        <ul className="list-unstyled row g-3 mb-3">
          {scope.map((image, index) => (
            <li key={image.id} className="col-6 col-md-4 col-xl-3">
              <div className="border rounded p-2 h-100 d-flex flex-column">
                <div
                  className="bg-light rounded mb-2 d-flex align-items-center justify-content-center"
                  style={{ aspectRatio: "1 / 1", overflow: "hidden" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- the API serves an
                     already downscaled, re-encoded WebP behind a digest-versioned URL. */}
                  <img
                    src={image.url}
                    alt={`Image ${index + 1} of ${scope.length}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="d-flex align-items-center justify-content-between gap-1">
                  <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {index + 1} / {scope.length}
                  </span>

                  {canWrite ? (
                    <div className="d-inline-flex gap-1">
                      <Button
                        type="button"
                        variant="outline-secondary"
                        size="sm"
                        className="px-2 py-1"
                        aria-label={`Move image ${index + 1} earlier`}
                        disabled={pending || index === 0}
                        onClick={() => move.mutate({ imageId: image.id, position: index - 1 })}
                      >
                        ←
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        size="sm"
                        className="px-2 py-1"
                        aria-label={`Move image ${index + 1} later`}
                        disabled={pending || index === scope.length - 1}
                        onClick={() => move.mutate({ imageId: image.id, position: index + 1 })}
                      >
                        →
                      </Button>
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        className="px-2 py-1"
                        aria-label={`Remove image ${index + 1}`}
                        disabled={pending}
                        onClick={() => remove.mutate(image.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        slots.full ? (
          <p className="text-muted small mb-0">
            All {slots.max} image slots for this {variantId ? "variant" : "product"} are used.
            Remove one to add another.
          </p>
        ) : (
          <Form.Group controlId={variantId ? `images-${variantId}` : "images-product"}>
            <Form.Label className="d-inline-flex align-items-center">
              <Upload size={14} className="me-1" />
              Add images
            </Form.Label>
            <Form.Control
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              disabled={pending}
              onChange={onPick}
            />
            <Form.Text className="text-muted d-block">
              PNG, JPEG, or WebP up to {IMAGE_MAX_LABEL}, fitted inside {IMAGE_FIT_LABEL} without
              cropping. {slots.used} of {slots.max} used.
              {upload.isPending ? " Uploading…" : ""}
            </Form.Text>
          </Form.Group>
        )
      ) : null}

      {error ? (
        <div className="text-danger small mt-2" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}