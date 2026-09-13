import LoginForm from "features/auth/components/login-form";

/**
 * Sign-in page.
 *
 * Public: `RouteGuard` allows it while signed out and redirects a signed-in seller
 * to the dashboard.
 */
export default function LoginPage() {
  return <LoginForm />;
}
