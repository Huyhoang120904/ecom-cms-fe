"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { ArrowLeft } from "react-feather";

import PageHeading from "widgets/page-heading";

import { ApiError } from "lib/api/client";

import { useAuth } from "features/auth/auth-context";

import ProductForm from "./product-form";
import { useProductQuery } from "../queries";

interface ProductFormPageProps {
  /** Create has no product yet; edit loads one by id and refuses a category change. */
  mode: "create" | "edit";
  productId?: string;
}

/**
 * The create/edit screen.
 *
 * Both modes share one form: the fields are the same and only the category is locked in
 * edit, because the contract never lets a product move between categories.
 */
export default function ProductFormPage({ mode, productId = "" }: ProductFormPageProps) {
  const router = useRouter();
  const { can } = useAuth();
  const product = useProductQuery(mode === "edit" ? productId : "");

  const canWrite = can("products:write");

  if (!canWrite) {
    return (
      <div className="container-fluid p-6">
        <PageHeading heading={mode === "create" ? "Add product" : "Edit product"} />
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-5 text-center">
            <p className="text-muted mb-3">
              Your role can read this shop&apos;s products but not change them.
            </p>
            <Link href="/products" className="btn btn-outline-secondary btn-sm">
              Back to products
            </Link>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const heading = mode === "create" ? "Add product" : "Edit product";
  const backLink = (
    <Link href="/products" className="back-link d-inline-flex align-items-center mb-3">
      <ArrowLeft size={15} className="me-1" />
      Back to products
    </Link>
  );

  if (mode === "edit") {
    if (product.isPending) {
      return (
        <div className="container-fluid p-6">
          {backLink}
          <PageHeading heading={heading} />
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
          {backLink}
          <PageHeading heading={notFound ? "Product not found" : heading} />
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-5 text-center">
              <Alert variant={notFound ? "secondary" : "danger"} role="alert" className="mb-3">
                {notFound
                  ? "This product is not in this shop. It may have been deleted, or the link may be wrong."
                  : error instanceof ApiError
                    ? error.message
                    : "The product could not be loaded."}
              </Alert>
              {notFound ? null : (
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
  }

  return (
    <div className="container-fluid p-6">
      {backLink}
      <PageHeading heading={heading} />
      <ProductForm
        mode={mode}
        product={product.data}
        onSaved={(saved) => router.push(`/products/${saved.id}`)}
      />
    </div>
  );
}