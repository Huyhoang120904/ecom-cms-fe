import { useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Form } from "react-bootstrap";

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
 * Four fields, so it uses local state plus `safeParse` rather than adding a form
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
      onSuccess: () => void router.replace("/"),
    });
  };

  const formError =
    register.error instanceof ApiError
      ? register.error.message
      : register.error
        ? "Registration failed."
        : null;

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
        <Alert variant="danger" role="alert" className="py-2">
          {formError}
        </Alert>
      ) : null}

      <Form noValidate onSubmit={submit}>
        <Form.Group className="mb-3" controlId="register-email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            autoComplete="username"
            value={values.email}
            maxLength={EMAIL_MAX}
            isInvalid={Boolean(fieldErrors.email)}
            onChange={set("email")}
          />
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
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            isInvalid={Boolean(fieldErrors.password)}
            onChange={set("password")}
          />
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
          <Form.Control
            type="text"
            name="full_name"
            autoComplete="name"
            value={values.full_name}
            minLength={FULL_NAME_MIN}
            maxLength={FULL_NAME_MAX}
            isInvalid={Boolean(fieldErrors.full_name)}
            onChange={set("full_name")}
          />
          {fieldErrors.full_name ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.full_name}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Form.Group className="mb-4" controlId="register-shop-name">
          <Form.Label>Shop name</Form.Label>
          <Form.Control
            type="text"
            name="shop_name"
            autoComplete="organization"
            value={values.shop_name}
            minLength={SHOP_NAME_MIN}
            maxLength={SHOP_NAME_MAX}
            isInvalid={Boolean(fieldErrors.shop_name)}
            onChange={set("shop_name")}
          />
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
          disabled={register.isPending}
          aria-busy={register.isPending}
        >
          {register.isPending ? "Creating account" : "Create account"}
        </Button>
      </Form>
    </AuthLayout>
  );
}
