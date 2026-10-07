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

import {
  BIO_MAX,
  EMAIL_MAX,
  FULL_NAME_MAX,
  FULL_NAME_MIN,
  JOB_TITLE_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PHONE_MAX,
  SHOP_DESCRIPTION_MAX,
  SHOP_NAME_MAX,
  SHOP_NAME_MIN,
  SHOP_WEBSITE_MAX,
} from "lib/auth/constants";

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
  email: z.string().min(1, "Enter your email.").max(EMAIL_MAX).email("Enter a valid email address."),
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
  full_name: z
    .string()
    .min(FULL_NAME_MIN, "Enter your name.")
    .max(FULL_NAME_MAX, `Use at most ${FULL_NAME_MAX} characters.`),
  shop_name: z
    .string()
    .min(SHOP_NAME_MIN, `Use at least ${SHOP_NAME_MIN} characters.`)
    .max(SHOP_NAME_MAX, `Use at most ${SHOP_NAME_MAX} characters.`),
});

// Mirrors LoginRequest. The password has no minimum beyond presence on purpose:
// rejecting a short password locally would report the stored password's shape.
// The email is format-checked so an obvious typo fails without a round trip.
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email.")
    .max(EMAIL_MAX)
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX),
});

// Mirrors ProfileUpdateRequest. An absent key is left alone; an explicit null
// clears a nullable field.
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(FULL_NAME_MIN, "Enter your name.")
    .max(FULL_NAME_MAX, `Use at most ${FULL_NAME_MAX} characters.`)
    .nullish(),
  bio: z.string().max(BIO_MAX, `Use at most ${BIO_MAX} characters.`).nullish(),
  phone: z.string().max(PHONE_MAX, `Use at most ${PHONE_MAX} characters.`).nullish(),
  job_title: z.string().max(JOB_TITLE_MAX, `Use at most ${JOB_TITLE_MAX} characters.`).nullish(),
});

// Mirrors ShopUpdateRequest. `slug` is deliberately absent: it is derived once at
// creation and a rename must not rewrite a public URL.
export const shopUpdateSchema = z.object({
  name: z
    .string()
    .min(SHOP_NAME_MIN, `Use at least ${SHOP_NAME_MIN} characters.`)
    .max(SHOP_NAME_MAX, `Use at most ${SHOP_NAME_MAX} characters.`)
    .nullish(),
  description: z.string().max(SHOP_DESCRIPTION_MAX, `Use at most ${SHOP_DESCRIPTION_MAX} characters.`).nullish(),
  contact_email: z.string().max(EMAIL_MAX).email("Enter a valid email address.").nullish(),
  contact_phone: z.string().max(PHONE_MAX, `Use at most ${PHONE_MAX} characters.`).nullish(),
  // The backend requires an absolute http or https URL, so a bare domain is
  // rejected here too rather than surfacing as a 422 after a round trip.
  website: z
    .string()
    .max(SHOP_WEBSITE_MAX, `Use at most ${SHOP_WEBSITE_MAX} characters.`)
    .refine(
      (value) => value.trim() === "" || /^https?:\/\//i.test(value.trim()),
      "Enter a full URL, including http:// or https://.",
    )
    .nullish(),
});

// Mirrors DeactivateRequest.
export const deactivateSchema = z.object({
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX),
});

// Mirrors DeleteShopRequest.
export const deleteShopSchema = z.object({
  confirm_shop_name: z
    .string()
    .min(SHOP_NAME_MIN, "Type the shop name.")
    .max(SHOP_NAME_MAX, `Use at most ${SHOP_NAME_MAX} characters.`),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
export type ShopUpdateFormValues = z.infer<typeof shopUpdateSchema>;
export type DeactivateFormValues = z.infer<typeof deactivateSchema>;
export type DeleteShopFormValues = z.infer<typeof deleteShopSchema>;

/**
 * Convert validated form values into the request body.
 *
 * A field the seller cleared becomes an explicit `null` (a deliberate clear), while
 * a field they never touched is omitted (unchanged). Collapsing those two into one
 * would make it impossible to clear a bio.
 */
export function toProfilePayload(form: ProfileUpdateFormValues): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = {};
  if (form.full_name != null) payload.full_name = form.full_name;
  if (form.bio !== undefined) payload.bio = form.bio;
  if (form.phone !== undefined) payload.phone = form.phone;
  if (form.job_title !== undefined) payload.job_title = form.job_title;
  return payload;
}

export function toShopPayload(form: ShopUpdateFormValues): ShopUpdatePayload {
  const payload: ShopUpdatePayload = {};
  if (form.name != null) payload.name = form.name;
  if (form.description !== undefined) payload.description = form.description;
  if (form.contact_email !== undefined) payload.contact_email = form.contact_email;
  if (form.contact_phone !== undefined) payload.contact_phone = form.contact_phone;
  if (form.website !== undefined) payload.website = form.website;
  return payload;
}

/**
 * Build the register body.
 *
 * `shop_name` is required by this app's form and is what makes the account a seller: the
 * backend creates a buyer-only account (a `storefront` perimeter) when the field is
 * omitted, which would leave the seller CMS with a session it cannot use.
 */
export function toRegisterPayload(form: RegisterFormValues): RegisterPayload {
  return {
    email: form.email,
    password: form.password,
    full_name: form.full_name,
    shop_name: form.shop_name,
  };
}

/**
 * Build the login body.
 *
 * `audience` is required and is always `cms` here: the backend defaults a login to
 * `storefront` (a buyer), and a storefront token is refused on every shop route even when
 * the same account owns a shop. Sending it explicitly is what tells the backend to issue a
 * seller session scoped to a shop.
 */
export function toLoginPayload(form: LoginFormValues): LoginPayload {
  return { email: form.email, password: form.password, audience: "cms" };
}

export function toDeactivatePayload(form: DeactivateFormValues): DeactivatePayload {
  return { password: form.password };
}

export function toDeleteShopPayload(form: DeleteShopFormValues): DeleteShopPayload {
  return { confirm_shop_name: form.confirm_shop_name };
}
