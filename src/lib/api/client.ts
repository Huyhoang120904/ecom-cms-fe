/**
 * Transport configuration for the seller CMS.
 *
 * This module owns the API origin only. Feature modules own their own
 * queries, mutations, schemas, and domain types; nothing here may import a
 * feature module.
 */

const DEFAULT_API_URL = "http://localhost:8000";

/** Base URL of the ecom-be API, without a trailing slash. */
export const apiBaseUrl: string = (
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
).replace(/\/+$/, "");

/** Error raised for a non-2xx API response. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** Shape of the backend's stable error body. */
interface ApiErrorBody {
  error?: unknown;
  message?: unknown;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

/** Build an absolute URL for a versioned API path. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalized}`;
}

function errorFrom(response: Response, body: unknown): ApiError {
  const errorBody = isErrorBody(body) ? body : {};
  const code =
    typeof errorBody.error === "string" ? errorBody.error : "request_failed";
  const message =
    typeof errorBody.message === "string"
      ? errorBody.message
      : `${response.status} ${response.statusText}`;
  return new ApiError(code, message, response.status);
}

/**
 * Read a JSON response, surfacing non-2xx responses as an {@link ApiError}.
 *
 * @throws {ApiError} When the response status is not 2xx.
 */
export async function readJson<T = unknown>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw errorFrom(response, body);
  }

  return body as T;
}

/**
 * Assert that a response succeeded and discard its body.
 *
 * For the endpoints that answer `204 No Content`: there is nothing to parse, but a
 * failure still has to be raised. Without this, a rejected deletion would resolve
 * and the caller would report success.
 *
 * @throws {ApiError} When the response status is not 2xx.
 */
export async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  const body: unknown = await response.json().catch(() => null);
  throw errorFrom(response, body);
}
