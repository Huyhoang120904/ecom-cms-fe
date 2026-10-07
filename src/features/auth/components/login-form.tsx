"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Form, InputGroup } from "react-bootstrap";
import { Eye, EyeOff, Lock, LogIn, Mail } from "react-feather";

import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from "lib/auth/constants";

import { useLoginMutation } from "features/auth/mutations";
import { loginErrorMessage } from "features/auth/error-messages";
import { loginSchema, toLoginPayload } from "features/auth/schemas";

import AuthLayout from "./auth-layout";

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Sign-in form.
 *
 * Labels sit above the inputs and errors below them. The submit button keeps its
 * width while pending, because a button that shrinks when its label changes shifts
 * the layout under the reader's cursor.
 */
export default function LoginForm() {
  const router = useRouter();
  // Nullable in the generated route types: a static prerender has no query string. An
  // empty set means "no `next` parameter", which is exactly the default below.
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const login = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === "email" ? "email" : "password";
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    // The payload mapper is what stamps the `cms` audience on the request; sending the form
    // values directly would let the backend default to a storefront (buyer) session.
    login.mutate(toLoginPayload(parsed.data), {
      onSuccess: () => {
        // `next` is set by the guard when it redirects from a guarded page.
        const next = searchParams.get("next") ?? "/";
        router.replace(next);
      },
    });
  };

  const formError = loginErrorMessage(login.error);

  return (
    <AuthLayout
      title="Sign in"
      intro="Use the email and password you registered with. Your shops and their catalogues are scoped to this account."
      altAction={{
        prompt: "No account yet?",
        label: "Create one",
        href: "/register",
      }}
    >
      {formError ? (
        <Alert variant="danger" role="alert" className="py-2 mb-4">
          {formError}
        </Alert>
      ) : null}

      <Form noValidate onSubmit={submit}>
        <Form.Group className="mb-3" controlId="login-email">
          <Form.Label>Email</Form.Label>
          <InputGroup hasValidation={Boolean(fieldErrors.email)}>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <Mail size={16} />
            </InputGroup.Text>
            <Form.Control
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              maxLength={EMAIL_MAX}
              isInvalid={Boolean(fieldErrors.email)}
              className="border-start-0 ps-0"
              placeholder="name@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </InputGroup>
          <Form.Text className="text-muted">
            The address you registered with.
          </Form.Text>
          {fieldErrors.email ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.email}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Form.Group className="mb-4" controlId="login-password">
          <Form.Label>Password</Form.Label>
          <InputGroup hasValidation={Boolean(fieldErrors.password)}>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <Lock size={16} />
            </InputGroup.Text>
            <Form.Control
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              isInvalid={Boolean(fieldErrors.password)}
              className="border-start-0 border-end-0 px-0"
              placeholder="Enter your password"
              onChange={(event) => setPassword(event.target.value)}
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
          {fieldErrors.password ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.password}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className="w-100 auth-submit-btn shadow-sm"
          disabled={login.isPending}
          aria-busy={login.isPending}
        >
          {login.isPending ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              Signing in
            </>
          ) : (
            <>
              <LogIn size={16} className="me-1" />
              Sign in
            </>
          )}
        </Button>
      </Form>
    </AuthLayout>
  );
}
