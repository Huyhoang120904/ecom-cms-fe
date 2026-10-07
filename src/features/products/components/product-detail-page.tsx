"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { ArrowLeft, Edit2, Package } from "react-feather";

import PageHeading from "widgets/page-heading";

import { ApiError } from "lib/api/client";

import { useAuth } from "features/auth/auth-context";
import { splitCategoryAttributes, useCategoryAttributesQuery } from "features/catalog";
import DeleteProductDialog from "features/products/components/delete-product-dialog";
import ProductImages from "features/products/components/product-images";
import VariantSection from "features/products/components/variant-section";
import { ProductStatusBadge } from "features/products/components/products-table";
import { formatDate, sellableSummary } from "features/products/mapping";
import {
  usePublishProductMutation,
  useUnpublishProductMutation,
} from "features/products/mutations";
import { useProductQuery } from "features/products/queries";
import type { ProductAttribute } from "features/products/types";

interface ProductDetailPageProps {
  productId: string;
}

/** The stored value of an attribute, in the field its type uses. */
function attributeValue(attribute: ProductAttribute): string {
  if (attribute.option_value !== null) return attribute.option_value;
  if (attribute.value_text !== null) return attribute.value_text;
  if (attribute.value_number !== null) return String(attribute.value_number);
  return "—";
}

/**
 * One product: what it is, what it looks like, what it costs, and whether it is on sale.
 *
 * The backend decides whether a product may be sold; this page states the requirements and
 * surfaces the refusal verbatim when publish is rejected, rather than guessing locally.
 */
export default function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const router = useRouter();
  const { can } = useAuth();
  const product = useProductQuery(productId);

  // Declared before any early return: a hook after a conditional return changes the hook
  // order between renders, which React refuses at runtime and the linter refuses here.
  const publish = usePublishProductMutation(productId);
  const unpublish = useUnpublishProductMutation(productId);

  const categoryId = product.data?.category_id ?? "";
  const attributes = useCategoryAttributesQuery(categoryId === "" ? null : categoryId);
  const { variation } = splitCategoryAttributes(attributes.data ?? []);

  const canWrite = can("products:write");

  if (product.isPending) {
    return (
      <div className="container-fluid p-6">
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner animation="border" size="sm" role="status" />
          Loading product…
        </div>
      </div>
    );
  }

  if (product.isError || !product.data) {
    const error = product.error;
    const notFound = error instanceof ApiError && error.code === "product_not_found";

    return (
      <div className="container-fluid p-6">
        <PageHeading heading={notFound ? "Product not found" : "Product"} />
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-5 text-center">
            <Alert variant={notFound ? "secondary" : "danger"} role="alert" className="mb-3">
              {notFound
                ? "This product is not in this shop. It may have been deleted, or the link may be wrong."
                : error instanceof ApiError
                  ? error.message
                  : "The product could not be loaded."}
            </Alert>
            {notFound ? (
              <Link href="/products" className="btn btn-outline-secondary btn-sm">
                Back to products
              </Link>
            ) : (
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                onClick={() => void product.refetch()}
              >
                Try again
              </Button>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  }

  const detail = product.data;
  const statusPending = publish.isPending || unpublish.isPending;
  const statusError = publish.error ?? unpublish.error;

  return (
    <div className="container-fluid p-6">
      <Link href="/products" className="back-link d-inline-flex align-items-center mb-3">
        <ArrowLeft size={15} className="me-1" />
        Back to products
      </Link>

      <PageHeading heading={detail.name}>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <ProductStatusBadge status={detail.status} />
          {canWrite ? (
            <>
              {detail.status === "active" ? (
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  disabled={statusPending}
                  aria-busy={statusPending}
                  onClick={() => unpublish.mutate()}
                >
                  {unpublish.isPending ? "Unpublishing" : "Unpublish"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={statusPending}
                  aria-busy={statusPending}
                  onClick={() => publish.mutate()}
                >
                  {publish.isPending ? "Publishing" : "Publish"}
                </Button>
              )}
              <Link
                href={`/products/${detail.id}/edit`}
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center"
              >
                <Edit2 size={14} className="me-1" />
                Edit product
              </Link>
            </>
          ) : null}
        </div>
      </PageHeading>

      {statusError ? (
        <Alert variant="danger" role="alert" className="mb-4">
          {statusError.message}
        </Alert>
      ) : null}

      <Row className="g-4">
        <Col xl={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h2 className="h5 fw-bold mb-3">Images</h2>
              <ProductImages
                productId={detail.id}
                images={detail.images}
                canWrite={canWrite}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col xl={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4">
              <h2 className="h5 fw-bold mb-3">Details</h2>

              <p className="text-muted small mb-4">{sellableSummary(detail)}</p>

              {detail.description ? (
                <p className="text-secondary mb-4">{detail.description}</p>
              ) : (
                <p className="text-muted fst-italic mb-4">
                  No description yet. Buyers see the name only.
                </p>
              )}

              <dl className="row mb-0 small">
                <dt className="col-5 text-muted fw-normal">Category</dt>
                <dd className="col-7">
                  {attributes.data
                    ? (attributes.data.length === 0
                        ? "No attributes configured"
                        : `${attributes.data.length} configured`)
                    : "—"}
                </dd>
                <dt className="col-5 text-muted fw-normal">Created</dt>
                <dd className="col-7">{formatDate(detail.created_at)}</dd>
                <dt className="col-5 text-muted fw-normal">Last change</dt>
                <dd className="col-7 mb-0">{formatDate(detail.updated_at)}</dd>
              </dl>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mt-4">
        <Card.Body className="p-4">
          <h2 className="h5 fw-bold mb-3">Attribute values</h2>
          {detail.attributes.length === 0 ? (
            <p className="text-muted small mb-0">
              No values recorded yet. The form asks for them once a category is chosen.
            </p>
          ) : (
            <dl className="row mb-0">
              {detail.attributes.map((attribute) => (
                <div key={attribute.attribute_id} className="col-md-6 d-flex mb-2">
                  <dt className="text-muted fw-normal me-2">{attribute.name}</dt>
                  <dd className="mb-0 fw-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {attributeValue(attribute)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm mt-4">
        <Card.Body className="p-4">
          <h2 className="h5 fw-bold mb-3">Variants</h2>
          <VariantSection
            product={detail}
            variationAttributes={variation}
            canWrite={canWrite}
          />
        </Card.Body>
      </Card>

      {canWrite ? (
        <Card className="border-0 shadow-sm mt-4">
          <Card.Body className="p-4">
            <h2 className="h5 fw-bold mb-2">Delete</h2>
            <DeleteProductDialog
              product={detail}
              onDeleted={() => router.replace("/products")}
            />
          </Card.Body>
        </Card>
      ) : (
        <p className="text-muted small mt-4 d-flex align-items-center">
          <Package size={14} className="me-1" />
          Your role can read this product but not change or delete it.
        </p>
      )}
    </div>
  );
}