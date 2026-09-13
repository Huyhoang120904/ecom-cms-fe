import { useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";

import {
  useDeleteShopBackgroundMutation,
  useUploadShopBackgroundMutation,
} from "features/shop/mutations";
import type { Shop } from "features/auth/types";

// Mirrors the backend's `max_upload_bytes` default, as the avatar field does.
const MAX_UPLOAD_BYTES = 2_097_152;
const MAX_UPLOAD_LABEL = "2 MB";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface BackgroundFieldProps {
  shop: Shop;
}

/**
 * The shop's banner image.
 *
 * Rendered as a plain image surface with no label or badge over it. If it ever needs
 * a caption, the caption goes below the image rather than on top of it.
 */
export default function BackgroundField({ shop }: BackgroundFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadShopBackgroundMutation();
  const remove = useDeleteShopBackgroundMutation();
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = (): void => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalError(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setLocalError(`That image is larger than ${MAX_UPLOAD_LABEL}. Choose a smaller one.`);
      reset();
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Use a PNG, JPEG, or WebP image.");
      reset();
      return;
    }

    upload.mutate(file, { onSettled: reset });
  };

  const error =
    localError ??
    (upload.error ? upload.error.message : null) ??
    (remove.error ? remove.error.message : null);
  const pending = upload.isPending || remove.isPending;

  return (
    <Form.Group className="mb-4" controlId="shop-background">
      <Form.Label>Background</Form.Label>

      {shop.background_url ? (
        /* eslint-disable-next-line @next/next/no-img-element -- the API already
           serves a cropped, re-encoded 1600x900 WebP, so handing it to the Next
           image optimizer would re-encode an already-optimized asset. */
        <img
          src={shop.background_url}
          alt=""
          width={1600}
          height={900}
          className="d-block w-100 rounded border mb-3"
          style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
        />
      ) : (
        <div
          className="d-flex align-items-center justify-content-center bg-light border rounded mb-3 text-muted small"
          style={{ aspectRatio: "16 / 9" }}
        >
          No background yet
        </div>
      )}

      <Form.Control
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        aria-label="Background image file"
        disabled={pending}
        onChange={onPick}
      />

      <div className="d-flex gap-2 mt-2">
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          disabled={pending || !shop.background_url}
          onClick={() => remove.mutate()}
        >
          {remove.isPending ? "Removing" : "Remove background"}
        </Button>
      </div>

      <Form.Text className="text-muted d-block mt-2">
        PNG, JPEG, or WebP up to {MAX_UPLOAD_LABEL}. Cropped to 16:9 (1600 by 900), and
        its location data is discarded.
      </Form.Text>

      {error ? (
        <div className="text-danger small mt-2" role="alert">
          {error}
        </div>
      ) : null}
    </Form.Group>
  );
}
