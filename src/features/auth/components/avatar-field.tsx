import { useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";

import {
  useDeleteAvatarMutation,
  useUploadAvatarMutation,
} from "features/auth/mutations";
import Avatar from "features/auth/components/avatar";
import type { User } from "features/auth/types";

/**
 * The avatar limit mirrors the backend's `max_upload_bytes` default.
 *
 * Checking here saves the seller a 2 MiB upload that would be rejected on arrival.
 * The backend re-checks the size and the real image content, so this is a courtesy
 * rather than a control.
 */
const MAX_UPLOAD_BYTES = 2_097_152;
const MAX_UPLOAD_LABEL = "2 MB";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface AvatarFieldProps {
  user: User;
}

export default function AvatarField({ user }: AvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatarMutation();
  const remove = useDeleteAvatarMutation();
  const [localError, setLocalError] = useState<string | null>(null);

  const onPick = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLocalError(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setLocalError(
        `That image is larger than ${MAX_UPLOAD_LABEL}. Choose a smaller one.`,
      );
      // Clear the input so picking the same file again still fires a change event.
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Use a PNG, JPEG, or WebP image.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    upload.mutate(file, {
      onSettled: () => {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      },
    });
  };

  const error =
    localError ??
    (upload.error ? upload.error.message : null) ??
    (remove.error ? remove.error.message : null);

  const pending = upload.isPending || remove.isPending;

  return (
    <Form.Group className="mb-4" controlId="profile-avatar">
      <Form.Label>Avatar</Form.Label>

      <div className="d-flex align-items-center gap-3">
        <Avatar user={user} size={64} />

        <div className="d-flex flex-column gap-2">
          <Form.Control
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            aria-label="Avatar image file"
            disabled={pending}
            onChange={onPick}
          />

          <div className="d-flex gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              disabled={pending || !user.avatar_url}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? "Removing" : "Remove avatar"}
            </Button>
          </div>
        </div>
      </div>

      <Form.Text className="text-muted d-block">
        PNG, JPEG, or WebP up to {MAX_UPLOAD_LABEL}. The image is square-cropped and
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
