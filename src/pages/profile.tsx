import { Container } from "react-bootstrap";

import ProfileForm from "features/auth/components/profile-form";
import PageHeading from "widgets/page-heading";

/**
 * Profile page.
 *
 * Guarded: it reads the session to render the seller's own fields, so the caller is
 * signed in by the time it mounts.
 */
export default function ProfilePage() {
  return (
    <Container fluid className="p-4">
      <PageHeading heading="Profile" />
      <ProfileForm />
    </Container>
  );
}
