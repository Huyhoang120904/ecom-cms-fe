/**
 * Clearer sentences for the refusals a seller can actually hit at sign-in.
 *
 * The backend's messages are fixed per code and never echo user data, which is the right
 * default. After the audience split, one of them is ambiguous out of context:
 *
 * - `account_inactive` on a `cms` login means the credentials were right but the account
 *   has no live shop to sign in to (a suspended shop, or a removed membership). The
 *   backend's own sentence — "This account is not active" — reads like a deactivation,
 *   which is a different code (`account_deactivated`).
 * - `forbidden` is what an admin-audience request without a platform membership answers.
 *
 * Everything else is passed through verbatim: the backend's sentence is the accurate one.
 */

import { ApiError } from "lib/api/client";

export function loginErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) return null;

  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message ? error.message : "Sign-in failed.";
  }

  if (error.code === "account_inactive") {
    return "This account has no active shop to sign in to. The shop may be suspended, or your membership may have been removed.";
  }

  if (error.code === "forbidden") {
    return "This account is not allowed to use the seller CMS.";
  }

  return error.message;
}