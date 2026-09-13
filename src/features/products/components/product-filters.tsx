import { useRouter } from "next/router";
import type { ChangeEvent } from "react";
import { Card, Form } from "react-bootstrap";

import { parseProductFilters } from "features/products/schemas";

/** Search filter that writes validated state back into the URL. */
export default function ProductFilters() {
  const router = useRouter();
  const filters = parseProductFilters(router.query);

  function updateSearch(event: ChangeEvent<HTMLInputElement>) {
    const search = event.target.value;
    void router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, search, page: 1 },
      },
      undefined,
      { shallow: true },
    );
  }

  return (
    <Card.Body className="px-4 py-3 border-bottom">
      <Form role="search">
        <Form.Label htmlFor="product-search">Search products</Form.Label>
        <Form.Control
          id="product-search"
          name="search"
          type="search"
          value={filters.search}
          placeholder="Name or SKU"
          onChange={updateSearch}
        />
      </Form>
    </Card.Body>
  );
}
