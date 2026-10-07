"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, InputGroup } from "react-bootstrap";
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShoppingBag,
  User,
  UserCheck,
} from "react-feather";

import { ApiError } from "lib/api/client";
import {
  EMAIL_MAX,
  FULL_NAME_MAX,
  FULL_NAME_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
  SHOP_NAME_MAX,
  SHOP_NAME_MIN,
} from "lib/auth/constants";

import { useRegisterMutation } from "features/auth/mutations";
import { registerSchema } from "features/auth/schemas";

import AuthLayout from "./auth-layout";

interface FieldErrors {
  email?: string;
  password?: string;
  full_name?: string;
  shop_name?: string;
}

/**
 * Registration form.
 *
 * Four fields, so it uses local state plus safeParse rather than adding a form
 * library. Every input carries the same bound the schema checks, so the browser
 * refuses an over-long value before a request is made.
 */
export default function RegisterForm() {
  const router = useRouter();
  const register = useRegisterMutation();

  const [values, setValues] = useState({
    email: "",
    password: "",
    full_name: "",
    shop_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const set =
    (key: keyof typeof values) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
    };

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    register.mutate(parsed.data, {
      // Registration signs the seller in and creates the shop, so there is nothing
      // to log into afterwards.
      onSuccess: () => router.replace("/"),
    });
  };

  const formError =
    register.error instanceof ApiError
      ? register.error.message
      : register.error
        ? "Registration failed."
        : null;

  const isPasswordValidLength = values.password.length >= PASSWORD_MIN;

  return (
    <AuthLayout
      title="Create your seller account"
      intro="This creates your account and its first shop together, then signs you in as the shop's owner."
      altAction={{
        prompt: "Already have an account?",
        label: "Sign in",
        href: "/login",
      }}
    >
      {formError ? (
        <Alert variant="danger" role="alert" className="py-2 mb-4">
          {formError}
        </Alert>
      ) : null}

      <Form noValidate onSubmit={submit}>
        <Form.Group className="mb-3" controlId="register-email">
          <Form.Label>Email</Form.Label>
          <InputGroup hasValidation={Boolean(fieldErrors.email)}>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <Mail size={16} />
            </InputGroup.Text>
            <Form.Control
              type="email"
              name="email"
              autoComplete="username"
              value={values.email}
              maxLength={EMAIL_MAX}
              isInvalid={Boolean(fieldErrors.email)}
              className="border-start-0 ps-0"
              placeholder="name@example.com"
              onChange={set("email")}
            />
          </InputGroup>
          <Form.Text className="text-muted">
            Used to sign in. Changing it later is not supported yet.
          </Form.Text>
          {fieldErrors.email ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.email}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Form.Group className="mb-3" controlId="register-password">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="mb-0">Password</Form.Label>
            {values.password.length > 0 ? (
              <span
                className={`small d-inline-flex align-items-center gap-1 ${
                  isPasswordValidLength ? "text-success fw-medium" : "text-muted"
                }`}
              >
                {isPasswordValidLength ? <Check size={12} /> : null}
                {values.password.length} / {PASSWORD_MIN} chars
              </span>
            ) : null}
          </div>
          <InputGroup hasValidation={Boolean(fieldErrors.password)}>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <Lock size={16} />
            </InputGroup.Text>
            <Form.Control
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={values.password}
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              isInvalid={Boolean(fieldErrors.password)}
              className="border-start-0 border-end-0 px-0"
              placeholder="Create a strong password"
              onChange={set("password")}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide characters" : "Show characters"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </InputGroup>
          <Form.Text className="text-muted">
            At least {PASSWORD_MIN} characters. Length matters more than symbols.
          </Form.Text>
          {fieldErrors.password ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.password}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Form.Group className="mb-3" controlId="register-full-name">
          <Form.Label>Your name</Form.Label>
          <InputGroup hasValidation={Boolean(fieldErrors.full_name)}>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <User size={16} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              name="full_name"
              autoComplete="name"
              value={values.full_name}
              minLength={FULL_NAME_MIN}
              maxLength={FULL_NAME_MAX}
              isInvalid={Boolean(fieldErrors.full_name)}
              className="border-start-0 ps-0"
              placeholder="e.g. Jane Smith"
              onChange={set("full_name")}
            />
          </InputGroup>
          {fieldErrors.full_name ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.full_name}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Form.Group className="mb-4" controlId="register-shop-name">
          <Form.Label>Shop name</Form.Label>
          <InputGroup hasValidation={Boolean(fieldErrors.shop_name)}>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <ShoppingBag size={16} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              name="shop_name"
              autoComplete="organization"
              value={values.shop_name}
              minLength={SHOP_NAME_MIN}
              maxLength={SHOP_NAME_MAX}
              isInvalid={Boolean(fieldErrors.shop_name)}
              className="border-start-0 ps-0"
              placeholder="e.g. Artisan Goods"
              onChange={set("shop_name")}
            />
          </InputGroup>
          <Form.Text className="text-muted">
            Shown to buyers later. Renaming is supported, so this is not permanent.
          </Form.Text>
          {fieldErrors.shop_name ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.shop_name}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className="w-100 auth-submit-btn shadow-sm"
          disabled={register.isPending}
          aria-busy={register.isPending}
        >
          {register.isPending ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              Creating account
            </>
          ) : (
            <>
              <UserCheck size={16} className="me-1" />
              Create account
            </>
          )}
        </Button>
      </Form>
    </AuthLayout>
  );
}
