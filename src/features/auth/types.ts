/**
 * Domain types for the auth module.
 *
 * These are re-exported from the generated contract rather than hand-written, so a
 * backend field rename fails `tsc` instead of silently rendering `undefined`.
 */

import type { components } from "lib/api/generated";

export type Session = components["schemas"]["SessionData"];
export type Me = components["schemas"]["MeData"];
export type User = components["schemas"]["UserData"];
export type Shop = components["schemas"]["ShopData"];
export type Membership = components["schemas"]["MembershipData"];
export type Role = components["schemas"]["RoleData"];

export type RegisterPayload = components["schemas"]["RegisterRequest"];
export type LoginPayload = components["schemas"]["LoginRequest"];
export type SwitchShopPayload = components["schemas"]["SwitchShopRequest"];
export type ProfileUpdatePayload = components["schemas"]["ProfileUpdateRequest"];
export type ShopUpdatePayload = components["schemas"]["ShopUpdateRequest"];
export type DeactivatePayload = components["schemas"]["DeactivateRequest"];
export type DeleteShopPayload = components["schemas"]["DeleteShopRequest"];
