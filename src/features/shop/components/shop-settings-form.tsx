import { useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";

import { ApiError } from "lib/api/client";
import {
  EMAIL_MAX,
  PHONE_MAX,
  SHOP_DESCRIPTION_MAX,
  SHOP_NAME_MAX,
  SHOP_NAME_MIN,
  SHOP_WEBSITE_MAX,
} from "lib/auth/constants";
import { clearSession } from "lib/auth/session";

import { useAuth } from "features/auth/auth-context";
import { shopUpdateSchema, toShopPayload } from "features/auth/schemas";
import { useUpdateShopMutation } from "features/shop/mutations";

import BackgroundField from "./background-field";
import DeleteShopDialog from "./delete-shop-dialog";

type FieldKey = "name" | "description" | "contact_email" | "contact_phone" | "website";

interface FieldErrors {
  name?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
}

/**
 * Shop settings for the active shop.
 *
 * The shop comes from the session payload, so there is no separate GET and no
 * second source of truth for which shop is being edited.
 */
export default function ShopSettingsForm() {
  const router = useRouter();
  const { session, can } = useAuth();
  const update = useUpdateShopMutation();

  const shop = session?.active_shop;

  const initial: Record<FieldKey, string> = {
    name: shop?.name ?? "",
    description: shop?.description ?? "",
    contact_email: shop?.contact_email ?? "",
    contact_phone: shop?.contact_phone ?? "",
    website: shop?.website ?? "",
  };

  const [form, setForm] = useState<Record<FieldKey, string>>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  if (!shop) {
    return null;
  }

  // Editing requires shop:update. The backend enforces this too; hiding the form
  // keeps a viewer from filling in a page that cannot be saved.
  if (!can("shop:update")) {
    return (
      <Alert variant="secondary">
        Your role on {shop.name} does not include editing its settings. Ask an owner
        for the manager role if you need to change them.
      </Alert>
    );
  }

  const set = (key: FieldKey) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFieldErrors({});
    setSaved(false);

    const changed: Record<string, string | null> = {};
    for (const key of Object.keys(initial) as FieldKey[]) {
      if (form[key] === initial[key]) {
        continue;
      }
      changed[key] = form[key] === "" ? null : form[key];
    }

    if (Object.keys(changed).length === 0) {
      setSaved(true);
      return;
    }

    const parsed = shopUpdateSchema.safeParse(changed);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as keyof FieldErrors] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    update.mutate(toShopPayload(parsed.data), { onSuccess: () => setSaved(true) });
  };

  const formError =
    update.error instanceof ApiError ? update.error.message : update.error ? "Save failed." : null;

  return (
    <Row className="g-4">
      <Col lg={7}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-1">Shop details</h2>
            <p className="text-muted small mb-4">
              Only the fields you change are sent.
            </p>

            {formError ? (
              <Alert variant="danger" role="alert" className="py-2">
                {formError}
              </Alert>
            ) : null}

            {saved && !update.isPending ? (
              <Alert variant="success" role="status" className="py-2">
                Shop saved
              </Alert>
            ) : null}

            <BackgroundField shop={shop} />

            <Form noValidate onSubmit={submit}>
              <Form.Group className="mb-3" controlId="shop-name">
                <Form.Label>Shop name</Form.Label>
                <Form.Control
                  type="text"
                  value={form.name}
                  minLength={SHOP_NAME_MIN}
                  maxLength={SHOP_NAME_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.name)}
                  onChange={set("name")}
                />
                <Form.Text className="text-muted">
                  Shown to buyers and to other members.
                </Form.Text>
                {fieldErrors.name ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.name}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-4" controlId="shop-description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.description}
                  maxLength={SHOP_DESCRIPTION_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.description)}
                  onChange={set("description")}
                />
                <Form.Text className="text-muted">
                  {SHOP_DESCRIPTION_MAX - form.description.length} characters left.
                </Form.Text>
                {fieldErrors.description ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.description}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-3" controlId="shop-contact-email">
                <Form.Label>Contact email</Form.Label>
                <Form.Control
                  type="email"
                  value={form.contact_email}
                  maxLength={EMAIL_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.contact_email)}
                  onChange={set("contact_email")}
                />
                <Form.Text className="text-muted">
                  Separate from the address you sign in with.
                </Form.Text>
                {fieldErrors.contact_email ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.contact_email}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-3" controlId="shop-contact-phone">
                <Form.Label>Contact phone</Form.Label>
                <Form.Control
                  type="tel"
                  value={form.contact_phone}
                  maxLength={PHONE_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.contact_phone)}
                  onChange={set("contact_phone")}
                />
                {fieldErrors.contact_phone ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.contact_phone}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Form.Group className="mb-4" controlId="shop-website">
                <Form.Label>Website</Form.Label>
                <Form.Control
                  type="url"
                  value={form.website}
                  maxLength={SHOP_WEBSITE_MAX}
                  disabled={update.isPending}
                  isInvalid={Boolean(fieldErrors.website)}
                  onChange={set("website")}
                />
                <Form.Text className="text-muted">
                  Include http:// or https://. Clear it to remove it.
                </Form.Text>
                {fieldErrors.website ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {fieldErrors.website}
                  </Form.Control.Feedback>
                ) : null}
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                disabled={update.isPending}
                aria-busy={update.isPending}
              >
                {update.isPending ? "Saving shop" : "Save shop"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={5}>
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-1">Public address</h2>
            <p className="text-muted small mb-3">
              The address buyers will see for this shop.
            </p>

            <dl className="mb-0">
              <dt className="small text-muted fw-normal">Slug</dt>
              <dd className="mb-2">
                <code>{shop.slug}</code>
              </dd>
            </dl>

            <p className="text-muted small mb-0">
              The slug is fixed. It does not change when you rename the shop, so links
              already shared keep working.
            </p>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-2">Close this shop</h2>
            <DeleteShopDialog
              shop={shop}
              onDeleted={() => {
                // The session was scoped to this shop, so it is no longer usable.
                clearSession();
                void router.replace("/login");
              }}
            />
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
