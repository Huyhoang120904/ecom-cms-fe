import { Container } from "react-bootstrap";

import { ShopSettingsForm } from "features/shop";
import PageHeading from "widgets/page-heading";

/**
 * Shop settings page.
 *
 * Guarded. It manages the shop the session is scoped to, so switching shops in the
 * account menu changes what this page edits.
 */
export default function ShopSettingsPage() {
  return (
    <Container fluid className="p-4">
      <PageHeading heading="Shop settings" />
      <ShopSettingsForm />
    </Container>
  );
}
