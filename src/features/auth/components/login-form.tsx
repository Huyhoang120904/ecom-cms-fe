import { useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Form } from "react-bootstrap";

import { ApiError } from "lib/api/client";
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from "lib/auth/constants";

import { useLoginMutation } from "features/auth/mutations";
import { loginSchema } from "features/auth/schemas";

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
  const login = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    login.mutate(parsed.data, {
      onSuccess: () => {
        // `next` is set by the guard when it redirects from a guarded page.
        const next = typeof router.query.next === "string" ? router.query.next : "/";
        void router.replace(next);
      },
    });
  };

  const formError =
    login.error instanceof ApiError ? login.error.message : login.error ? "Sign-in failed." : null;

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
        <Alert variant="danger" role="alert" className="py-2">
          {formError}
        </Alert>
      ) : null}

      <Form noValidate onSubmit={submit}>
        <Form.Group className="mb-3" controlId="login-email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            maxLength={EMAIL_MAX}
            isInvalid={Boolean(fieldErrors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
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
          <Form.Control
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            isInvalid={Boolean(fieldErrors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
          {fieldErrors.password ? (
            <Form.Control.Feedback type="invalid" className="d-block">
              {fieldErrors.password}
            </Form.Control.Feedback>
          ) : null}
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          disabled={login.isPending}
          aria-busy={login.isPending}
        >
          {login.isPending ? "Signing in" : "Sign in"}
        </Button>
      </Form>
    </AuthLayout>
  );
}
