"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";

import { ApiError } from "lib/api/client";
import { BIO_MAX, FULL_NAME_MAX, FULL_NAME_MIN, JOB_TITLE_MAX, PHONE_MAX } from "lib/auth/constants";

import { useAuth } from "features/auth/auth-context";
import { useUpdateProfileMutation } from "features/auth/mutations";
import { profileUpdateSchema, toProfilePayload } from "features/auth/schemas";

import AvatarField from "./avatar-field";
import DeactivateDialog from "./deactivate-dialog";

interface FieldErrors {
  full_name?: string;
  bio?: string;
  phone?: string;
  job_title?: string;
}

type FieldKey = "full_name" | "bio" | "phone" | "job_title";

const EMPTY: Record<FieldKey, string> = {
  full_name: "",
  bio: "",
  phone: "",
  job_title: "",
};

function currentValues(form: Record<FieldKey, string>, initial: Record<FieldKey, string>) {
  // Only the fields that differ from what the server holds are sent, which is what
  // makes the partial body meaningful: an untouched field is absent, and a field the
  // seller cleared is an explicit null.
  const payload: Record<string, string | null> = {};
  for (const key of Object.keys(EMPTY) as FieldKey[]) {
    if (form[key] === initial[key]) {
      continue;
    }
    payload[key] = form[key] === "" ? null : form[key];
  }
  return payload;
}

/** The editable part of a seller's own profile. */
export default function ProfileForm() {
  const router = useRouter();
  const { session } = useAuth();
  const update = useUpdateProfileMutation();

  const user = session?.user;
  const initial: Record<FieldKey, string> = {
    full_name: user?.full_name ?? "",
    bio: user?.bio ?? "",
    phone: user?.phone ?? "",
    job_title: user?.job_title ?? "",
  };

  const [form, setForm] = useState<Record<FieldKey, string>>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  if (!user) {
    return null;
  }

  const set = (key: FieldKey) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFieldErrors({});
    setSaved(false);

    const changed = currentValues(form, initial);
    if (Object.keys(changed).length === 0) {
      setSaved(true);
      return;
    }

    const parsed = profileUpdateSchema.safeParse(changed);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as keyof FieldErrors] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    update.mutate(toProfilePayload(parsed.data), {
      onSuccess: () => setSaved(true),
    });
  };

  const formError =
    update.error instanceof ApiError ? update.error.message : update.error ? "Save failed." : null;

  return (
    <Row className="g-4">
      <Col lg={7}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-1">Your profile</h2>
            <p className="text-muted small mb-4">
              This is what other members of your shops see. Only the fields you change
              are sent.
            </p>

            {formError ? (
              <Alert variant="danger" role="alert" className="py-2">
                {formError}
              </Alert>
            ) : null}

            {saved && !update.isPending ? (
              <Alert variant="success" role="status" className="py-2">
                Profile saved
              </Alert>
            ) : null}

            <AvatarField user={user} />

            <Form noValidate onSubmit={submit}>
              <Form.Group className="mb-3" controlId="profile-full-name">
                <Form.Label>Your name</Form.Label>
                <Form.Control
                  type="text"
                  value={form.full_name}
                  minLength={FULL_NAME_MIN}
                  maxLength={FULL_NAME_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.full_name)}
                  onChange={set("full_name")}
                />
                <Form.Text className="text-muted">
                  Cannot be left empty. This is the name shown throughout the CMS.
                </Form.Text>
                {fieldErrors.full_name ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.full_name}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-3" controlId="profile-job-title">
                <Form.Label>Job title</Form.Label>
                <Form.Control
                  type="text"
                  value={form.job_title}
                  maxLength={JOB_TITLE_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.job_title)}
                  onChange={set("job_title")}
                />
                <Form.Text className="text-muted">Optional. Clear it to remove it.</Form.Text>
                {fieldErrors.job_title ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.job_title}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-3" controlId="profile-phone">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="tel"
                  value={form.phone}
                  maxLength={PHONE_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.phone)}
                  onChange={set("phone")}
                />
                <Form.Text className="text-muted">
                  Optional. Stored as a normalized number.
                </Form.Text>
                {fieldErrors.phone ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.phone}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-4" controlId="profile-bio">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={form.bio}
                  maxLength={BIO_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.bio)}
                  onChange={set("bio")}
                />
                <Form.Text className="text-muted">
                  {BIO_MAX - form.bio.length} characters left.
                </Form.Text>
                {fieldErrors.bio ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.bio}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                disabled={update.isPending}
                aria-busy={update.isPending}
              >
                {update.isPending ? "Saving profile" : "Save profile"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={5}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-1">Account</h2>
            <dl className="mb-4">
              <dt className="small text-muted fw-normal">Email</dt>
              <dd className="mb-3">{user.email}</dd>
              <dt className="small text-muted fw-normal">Member since</dt>
              <dd className="mb-0">
                {new Date(user.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </dl>

            <h3 className="h6 fw-bold mb-2">Leave</h3>
            <DeactivateDialog onDeactivated={() => router.replace("/login")} />
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
