/**
 * Domain types for the auth module.
 *
 * Hand-written from the backend contract (`ecom-be` `app/schemas/identity/*`), because
 * this repository no longer generates types from the served OpenAPI document. Each type
 * names the schema it mirrors, so a field rename over there is a documented one-line
 * change over here rather than a silent `undefined` at render time. The zod schemas in
 * `./schemas.ts` are the runtime counterpart: they fail loudly when the wire moves.
 */

/** Mirrors `UserData`. Optional fields are nullable in the backend. */
export interface User {
  id: string;
  email: string;
  full_name: string;
  bio?: string | null;
  phone?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

/** Mirrors `ShopData`. */
export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  background_url?: string | null;
}

/** Mirrors `RoleData`. The role is an object on the wire, not a bare string. */
export interface Role {
  key: string;
  name: string;
}

/** Mirrors `MembershipData`: the shop plus the role held in it. */
export interface Membership {
  shop: Shop;
  role: Role;
}

/** Mirrors the backend's token perimeters. */
export type Audience = "storefront" | "cms" | "admin";

/**
 * Mirrors `MeData`, the payload of `GET /api/v1/auth/me`.
 *
 * `audience` is the perimeter the access token was issued for, and it is the field a client
 * uses to decide what to render: a `storefront` token is refused on every shop route even
 * when the same account owns a shop. `active_shop` is null for a buyer or a platform
 * administrator, neither of which holds a shop scope.
 */
export interface Me {
  user: User;
  audience: Audience;
  active_shop: Shop | null;
  memberships: Membership[];
  permissions: string[];
  /** True only for the `sys_admin` platform role. It holds every permission by design. */
  is_platform_admin: boolean;
}

/** The `me` payload's name in the plan and the test fixtures. */
export type MePayload = Me;

/** Mirrors `SessionData`, the payload of login, register, and refresh. */
export interface Session {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  audience: Audience;
  user: User;
  active_shop: Shop | null;
  memberships: Membership[];
  permissions: string[];
}

/** Mirrors `RegisterRequest`. */
export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  shop_name: string;
}

/** Mirrors `LoginRequest`. `audience` is set by the module, not by the seller. */
export interface LoginPayload {
  email: string;
  password: string;
  audience: Audience;
}

/** Mirrors `SwitchShopRequest`. */
export interface SwitchShopPayload {
  shop_id: string;
}

/** Mirrors `ProfileUpdateRequest`. An absent key leaves the field alone. */
export interface ProfileUpdatePayload {
  full_name?: string | null;
  bio?: string | null;
  phone?: string | null;
  job_title?: string | null;
}

/** Mirrors `ShopUpdateRequest`. `slug` is deliberately absent: it is fixed once. */
export interface ShopUpdatePayload {
  name?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
}

/** Mirrors `DeactivateRequest`. */
export interface DeactivatePayload {
  password: string;
}

/** Mirrors `DeleteShopRequest`. The backend compares the typed name itself. */
export interface DeleteShopPayload {
  confirm_shop_name: string;
}
