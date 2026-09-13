/**
 * Public exports of the auth module.
 *
 * Routes and other features import from this file, never from a deep path.
 */
export {
  deactivateAccount,
  deleteAvatar,
  deleteShop,
  deleteShopBackground,
  fetchMe,
  login,
  logout,
  register,
  switchShop,
  updateProfile,
  updateShop,
  uploadAvatar,
  uploadShopBackground,
} from "./api";
export { authKeys } from "./query-keys";
export {
  deactivateSchema,
  deleteShopSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  shopUpdateSchema,
  toDeactivatePayload,
  toDeleteShopPayload,
  toLoginPayload,
  toProfilePayload,
  toRegisterPayload,
  toShopPayload,
} from "./schemas";
export type {
  DeactivateForm,
  DeleteShopForm,
  LoginForm,
  ProfileUpdateForm,
  RegisterForm,
  ShopUpdateForm,
} from "./schemas";
export type {
  DeactivatePayload,
  DeleteShopPayload,
  LoginPayload,
  Me,
  Membership,
  ProfileUpdatePayload,
  RegisterPayload,
  Role,
  Session,
  Shop,
  ShopUpdatePayload,
  SwitchShopPayload,
  User,
} from "./types";
