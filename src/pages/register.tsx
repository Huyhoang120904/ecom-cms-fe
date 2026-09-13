import RegisterForm from "features/auth/components/register-form";

/**
 * Registration page.
 *
 * Public: `RouteGuard` allows it while signed out and redirects a signed-in seller
 * to the dashboard.
 */
export default function RegisterPage() {
  return <RegisterForm />;
}
