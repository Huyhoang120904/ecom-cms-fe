import Image from "next/image";

import type { User } from "features/auth/types";

/**
 * Initials for the monogram fallback.
 *
 * Takes the first letter of the first two words and uppercases them. A single-word
 * or empty name still produces something renderable rather than an empty box.
 */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

interface AvatarProps {
  user: User;
  size?: number;
}

/**
 * A fixed-size avatar.
 *
 * The reserved dimensions matter: an image that loads without them reflows the
 * header around it. The monogram fallback exists so an account with no avatar has a
 * composed state rather than a grey box.
 */
export default function Avatar({ user, size = 32 }: AvatarProps) {
  if (!user.avatar_url) {
    return (
      <span
        className="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-25 fw-medium"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-hidden="true"
      >
        {initials(user.full_name)}
      </span>
    );
  }

  return (
    // An empty `alt` is deliberate: the name is rendered next to it as text, so a
    // description here would make a screen reader say it twice.
    <Image
      src={user.avatar_url}
      alt=""
      width={size}
      height={size}
      className="rounded-circle"
      unoptimized
    />
  );
}
