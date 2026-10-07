"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";

import { ApiError } from "lib/api/client";

import {
  attributeTypeLabel,
  flattenLeafCategories,
  splitCategoryAttributes,
  useBrandsQuery,
  useCategoryAttributesQuery,
  useCategoryTreeQuery,
  type CategoryAttribute,
} from "features/catalog";
import { PRODUCT_DESCRIPTION_MAX, PRODUCT_NAME_MAX } from "features/products/constants";
import {
  attributeFieldLabel,
  attributeValueErrors,
  attributeValueIsEmpty,
  type AttributeValuesById,
} from "features/products/schemas";
import {
  emptyAttributeValue,
  emptyProductForm,
  formToCreatePayload,
  formToUpdatePayload,
  productToAttributeValues,
  productToFormValues,
} from "features/products/mapping";
import { useCreateProductMutation, useUpdateProductMutation } from "features/products/mutations";
import type { Product } from "features/products/types";

interface ProductFormProps {
  /** Edit locks the category: the contract refuses to move a product between categories. */
  mode: "create" | "edit";
  product?: Product;
  onSaved: (product: Product) => void;
}

/**
 * The product's own fields and attribute values.
 *
 * The attribute fields are built from the chosen category's configuration, so a category
 * that asks for "Material" or "Warranty" produces those inputs without a code change, and
 * a variation attribute never appears here — it is an axis of the variant table.
 */
export default function ProductForm({ mode, product, onSaved }: ProductFormProps) {
  const tree = useCategoryTreeQuery();
  const brands = useBrandsQuery();
  const create = useCreateProductMutation();
  const update = useUpdateProductMutation(product?.id ?? "");

  const [form, setForm] = useState(() =>
    product ? productToFormValues(product) : emptyProductForm(),
  );
  const [values, setValues] = useState<AttributeValuesById>(() =>
    product ? productToAttributeValues(product.attributes) : {},
  );
  const [basicsErrors, setBasicsErrors] = useState<Record<string, string>>({});
  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});

  const categoryId = form.category_id === "" ? null : form.category_id;
  const attributes = useCategoryAttributesQuery(categoryId);
  const { plain, variation } = useMemo(
    () => splitCategoryAttributes(attributes.data ?? []),
    [attributes.data],
  );

  const categoryOptions = useMemo(
    () => flattenLeafCategories(tree.data ?? []),
    [tree.data],
  );

  const pending = create.isPending || update.isPending;
  const failure = create.error ?? update.error;

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setBasicsErrors({});
    setAttributeErrors({});

    const name = form.name.trim();
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Use at least 2 characters.";
    if (name.length > PRODUCT_NAME_MAX) errors.name = `Use at most ${PRODUCT_NAME_MAX} characters.`;
    if ((form.description ?? "").length > PRODUCT_DESCRIPTION_MAX) {
      errors.description = `Use at most ${PRODUCT_DESCRIPTION_MAX} characters.`;
    }
    if (mode === "create" && form.category_id === "") {
      errors.category_id = "Choose a category.";
    }

    const perAttribute = attributeValueErrors(plain, values);
    // Only publish demands every required attribute; a draft may be incomplete. A
    // *malformed* value still blocks, because the payload builder would drop it and the
    // seller would silently lose what they typed.
    const allowIncomplete = mode === "create" || product?.status === "draft";
    const blockingAttributeErrors = pickBlocking(plain, values, perAttribute, allowIncomplete);

    if (Object.keys(errors).length > 0 || Object.keys(blockingAttributeErrors).length > 0) {
      setBasicsErrors(errors);
      setAttributeErrors(blockingAttributeErrors);
      document.getElementById("product-form-errors")?.focus();
      return;
    }

    if (mode === "create") {
      create.mutate(formToCreatePayload(form, plain, values), { onSuccess: onSaved });
      return;
    }
    update.mutate(formToUpdatePayload(form, plain, values), { onSuccess: onSaved });
  };

  const errorSummary = [
    ...Object.values(basicsErrors),
    ...Object.values(attributeErrors),
  ];

  return (
    <Form noValidate onSubmit={submit}>
      {errorSummary.length > 0 ? (
        <Alert
          id="product-form-errors"
          variant="danger"
          role="alert"
          tabIndex={-1}
          className="mb-4"
        >
          <p className="fw-semibold mb-2">There is a problem</p>
          <ul className="mb-0 ps-3">
            {errorSummary.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {failure ? (
        <Alert variant="danger" role="alert" className="mb-4">
          {failure instanceof ApiError ? failure.message : "The product could not be saved."}
        </Alert>
      ) : null}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h2 className="h5 fw-bold mb-3">Product</h2>

              <Form.Group className="mb-3" controlId="product-name">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  value={form.name}
                  maxLength={PRODUCT_NAME_MAX}
                  disabled={pending}
                  isInvalid={Boolean(basicsErrors.name)}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                {basicsErrors.name ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {basicsErrors.name}
                  </Form.Control.Feedback>
                ) : (
                  <Form.Text className="text-muted">What buyers will see.</Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3" controlId="product-category">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={form.category_id}
                  disabled={pending || mode === "edit" || tree.isPending}
                  isInvalid={Boolean(basicsErrors.category_id)}
                  onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                >
                  <option value="">
                    {tree.isPending ? "Loading categories…" : "Choose a category"}
                  </option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {"\u00a0".repeat(option.depth * 3)}
                      {option.name}
                    </option>
                  ))}
                </Form.Select>
                {basicsErrors.category_id ? (
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {basicsErrors.category_id}
                  </Form.Control.Feedback>
                ) : (
                  <Form.Text className="text-muted">
                    {mode === "edit"
                      ? "A product never changes category. Create a new one to move it."
                      : "Only categories with no sub-categories can hold products."}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3" controlId="product-brand">
                <Form.Label>Brand</Form.Label>
                <Form.Select
                  value={form.brand_id ?? ""}
                  disabled={pending || brands.isPending}
                  onChange={(event) => setForm({ ...form, brand_id: event.target.value })}
                >
                  <option value="">No brand</option>
                  {(brands.data ?? []).map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-0" controlId="product-description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={form.description ?? ""}
                  maxLength={PRODUCT_DESCRIPTION_MAX}
                  disabled={pending}
                  isInvalid={Boolean(basicsErrors.description)}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
                <Form.Text className="text-muted">
                  {(form.description ?? "").length} of {PRODUCT_DESCRIPTION_MAX} characters.
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h2 className="h5 fw-bold mb-1">Details</h2>
              <p className="text-muted small mb-3">
                Fields this category asks for.
              </p>

              {attributes.isError ? (
                <Alert variant="danger" role="alert" className="py-2">
                  {attributes.error instanceof ApiError
                    ? attributes.error.message
                    : "The category's attributes could not be loaded."}
                </Alert>
              ) : null}

              {categoryId === null ? (
                <p className="text-muted small mb-0">
                  Choose a category to see the details it asks for.
                </p>
              ) : attributes.isPending ? (
                <p className="text-muted small mb-0">Loading this category&apos;s fields…</p>
              ) : plain.length === 0 ? (
                <p className="text-muted small mb-0">
                  This category asks for no details beyond the name and description.
                </p>
              ) : (
                plain.map((attribute) => (
                  <AttributeField
                    key={attribute.id}
                    attribute={attribute}
                    value={values[attribute.id]}
                    error={attributeErrors[attribute.id]}
                    disabled={pending}
                    onChange={(next) =>
                      setValues((current) => ({ ...current, [attribute.id]: next }))
                    }
                  />
                ))
              )}

              {variation.length > 0 ? (
                <p className="text-muted small mt-3 mb-0">
                  {variation.map((attribute) => attribute.name).join(", ")} define the variants,
                  so they are entered on the variant table rather than here.
                </p>
              ) : null}
            </Card.Body>
          </Card>

          <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
            {pending ? "Saving" : mode === "create" ? "Create draft product" : "Save changes"}
          </Button>
          <p className="text-muted small mt-2 mb-0">
            {mode === "create"
              ? "A new product is saved as a draft. Add a variant and images, then publish it."
              : "Saving keeps the product's status. Publishing happens on the product page."}
          </p>
        </Col>
      </Row>
    </Form>
  );
}

/**
 * One attribute input, chosen by the attribute's own data type.
 *
 * A `SELECT` renders its options, a `NUMBER` renders a numeric field, and everything else
 * is text; the label carries the required marker the category set.
 */
function AttributeField({
  attribute,
  value,
  error,
  disabled,
  onChange,
}: {
  attribute: CategoryAttribute;
  value: AttributeValuesById[string];
  error?: string;
  disabled: boolean;
  onChange: (next: { optionId?: string; valueText?: string; valueNumber?: string }) => void;
}) {
  const controlId = `attribute-${attribute.id}`;

  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label>{attributeFieldLabel(attribute)}</Form.Label>

      {attribute.type === "SELECT" ? (
        <Form.Select
          value={value?.optionId ?? ""}
          disabled={disabled}
          isInvalid={Boolean(error)}
          onChange={(event) => onChange({ optionId: event.target.value })}
        >
          <option value="">Choose one</option>
          {attribute.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.value}
            </option>
          ))}
        </Form.Select>
      ) : (
        <Form.Control
          type={attribute.type === "NUMBER" ? "number" : "text"}
          step={attribute.type === "NUMBER" ? "any" : undefined}
          value={attribute.type === "NUMBER" ? (value?.valueNumber ?? "") : (value?.valueText ?? "")}
          disabled={disabled}
          isInvalid={Boolean(error)}
          onChange={(event) =>
            attribute.type === "NUMBER"
              ? onChange({ valueNumber: event.target.value })
              : onChange({ valueText: event.target.value })
          }
        />
      )}

      {error ? (
        <Form.Control.Feedback type="invalid" className="d-block">
          {error}
        </Form.Control.Feedback>
      ) : (
        <Form.Text className="text-muted">
          {attributeTypeLabel(attribute.type)}
          {attribute.required ? " · required by this category" : ""}
        </Form.Text>
      )}
    </Form.Group>
  );
}

/**
 * Decide which attribute errors stop a save.
 *
 * A draft may be incomplete — the backend accepts a `draft` or `PATCH` without the required
 * attributes and only refuses at `publish` — so while the product may stay a draft, a
 * *missing* required value is left out of the blocking set and a *malformed* one stays in.
 * Refusing a save because a field the seller has not reached yet is empty would be the
 * form inventing a rule the contract does not have.
 */
function pickBlocking(
  attributes: CategoryAttribute[],
  values: AttributeValuesById,
  perAttribute: Record<string, string>,
  allowIncomplete: boolean,
): Record<string, string> {
  if (!allowIncomplete) return perAttribute;

  const blocking: Record<string, string> = {};
  for (const [attributeId, message] of Object.entries(perAttribute)) {
    const attribute = attributes.find((item) => item.id === attributeId);
    if (!attribute) {
      blocking[attributeId] = message;
      continue;
    }
    if (!attributeValueIsEmpty(values[attributeId])) {
      blocking[attributeId] = message;
    }
  }
  return blocking;
}