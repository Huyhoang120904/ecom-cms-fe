/**
 * Public exports of the auth module.
 *
 * Routes and other features import from this file, never from a deep path.
 */
export {
  deactivateAccount,
  deleteAvatar,
  fetchMe,
  login,
  logout,
  register,
  switchShop,
  updateProfile,
  uploadAvatar,
} from "./api";
export { authKeys } from "./query-keys";
export { AuthContext, AuthProvider, useAuth } from "./auth-context";
export type { AuthStatus, AuthValue } from "./auth-context";
export { default as AuthLayout } from "./components/auth-layout";
export { default as LoginForm } from "./components/login-form";
export { default as ProfileForm } from "./components/profile-form";
export { default as RegisterForm } from "./components/register-form";
export {
  useDeactivateMutation,
  useDeleteAvatarMutation,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useSwitchShopMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "./mutations";
export { useMeQuery } from "./queries";
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
  DeactivateFormValues,
  DeleteShopFormValues,
  LoginFormValues,
  ProfileUpdateFormValues,
  RegisterFormValues,
  ShopUpdateFormValues,
} from "./schemas";
export type {
  DeactivatePayload,
  LoginPayload,
  Me,
  MePayload,
  Membership,
  ProfileUpdatePayload,
  RegisterPayload,
  Role,
  Session,
  Shop,
  SwitchShopPayload,
  User,
} from "./types";
