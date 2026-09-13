import { useRouter } from "next/router";
import type { ChangeEvent } from "react";
import { Card, Form } from "react-bootstrap";

import { parseOrderFilters } from "features/orders/schemas";

/** Search filter that writes validated state back into the URL. */
export default function OrderFilters() {
  const router = useRouter();
  const filters = parseOrderFilters(router.query);

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
        <Form.Label htmlFor="order-search">Search orders</Form.Label>
        <Form.Control
          id="order-search"
          name="search"
          type="search"
          value={filters.search}
          placeholder="Order reference"
          onChange={updateSearch}
        />
      </Form>
    </Card.Body>
  );
}
