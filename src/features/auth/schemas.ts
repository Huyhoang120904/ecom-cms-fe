/**
 * Request validation for the auth module.
 *
 * The bounds are read off the generated contract, not chosen here. If the backend
 * widens `bio` to 800, this file's copy of the number must move with it, which is
 * why each bound names the schema it came from.
 *
 * Client validation is a courtesy to the seller, never an authorization claim.
 * The backend re-validates everything.
 */

import { z } from "zod";

import type {
  DeactivatePayload,
  DeleteShopPayload,
  LoginPayload,
  ProfileUpdatePayload,
  RegisterPayload,
  ShopUpdatePayload,
} from "./types";

// Mirrors RegisterRequest.
export const registerSchema = z.object({
  email: z.string().min(1, "Enter your email.").max(254).email("Enter a valid email address."),
  password: z
    .string()
    .min(12, "Use at least 12 characters.")
    .max(128, "Use at most 128 characters."),
  full_name: z
    .string()
    .min(1, "Enter your name.")
    .max(120, "Use at most 120 characters."),
  shop_name: z
    .string()
    .min(2, "Use at least 2 characters.")
    .max(80, "Use at most 80 characters."),
});

// Mirrors LoginRequest. The password has no minimum beyond presence on purpose:
// rejecting a short password locally would report the stored password's shape.
export const loginSchema = z.object({
  email: z.string().min(1, "Enter your email.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

// Mirrors ProfileUpdateRequest. An absent key is left alone; an explicit null
// clears a nullable field.
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, "Enter your name.")
    .max(120, "Use at most 120 characters.")
    .nullish(),
  bio: z.string().max(500, "Use at most 500 characters.").nullish(),
  phone: z.string().max(32, "Use at most 32 characters.").nullish(),
  job_title: z.string().max(80, "Use at most 80 characters.").nullish(),
});

// Mirrors ShopUpdateRequest. `slug` is deliberately absent: it is derived once at
// creation and a rename must not rewrite a public URL.
export const shopUpdateSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters.").max(80, "Use at most 80 characters.").nullish(),
  description: z.string().max(300, "Use at most 300 characters.").nullish(),
  contact_email: z.string().max(254).email("Enter a valid email address.").nullish(),
  contact_phone: z.string().max(32, "Use at most 32 characters.").nullish(),
  website: z.string().max(255, "Use at most 255 characters.").nullish(),
});

// Mirrors DeactivateRequest.
export const deactivateSchema = z.object({
  password: z.string().min(1, "Enter your password.").max(128),
});

// Mirrors DeleteShopRequest.
export const deleteShopSchema = z.object({
  confirm_shop_name: z
    .string()
    .min(2, "Type the shop name.")
    .max(80, "Use at most 80 characters."),
});

export type RegisterForm = z.infer<typeof registerSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;
export type ShopUpdateForm = z.infer<typeof shopUpdateSchema>;
export type DeactivateForm = z.infer<typeof deactivateSchema>;
export type DeleteShopForm = z.infer<typeof deleteShopSchema>;

/**
 * Convert validated form values into the request body.
 *
 * A field the seller cleared becomes an explicit `null` (a deliberate clear), while
 * a field they never touched is omitted (unchanged). Collapsing those two into one
 * would make it impossible to clear a bio.
 */
export function toProfilePayload(form: ProfileUpdateForm): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = {};
  if (form.full_name != null) payload.full_name = form.full_name;
  if (form.bio !== undefined) payload.bio = form.bio;
  if (form.phone !== undefined) payload.phone = form.phone;
  if (form.job_title !== undefined) payload.job_title = form.job_title;
  return payload;
}

export function toShopPayload(form: ShopUpdateForm): ShopUpdatePayload {
  const payload: ShopUpdatePayload = {};
  if (form.name != null) payload.name = form.name;
  if (form.description !== undefined) payload.description = form.description;
  if (form.contact_email !== undefined) payload.contact_email = form.contact_email;
  if (form.contact_phone !== undefined) payload.contact_phone = form.contact_phone;
  if (form.website !== undefined) payload.website = form.website;
  return payload;
}

export function toRegisterPayload(form: RegisterForm): RegisterPayload {
  return {
    email: form.email,
    password: form.password,
    full_name: form.full_name,
    shop_name: form.shop_name,
  };
}

export function toLoginPayload(form: LoginForm): LoginPayload {
  return { email: form.email, password: form.password };
}

export function toDeactivatePayload(form: DeactivateForm): DeactivatePayload {
  return { password: form.password };
}

export function toDeleteShopPayload(form: DeleteShopForm): DeleteShopPayload {
  return { confirm_shop_name: form.confirm_shop_name };
}
