import type { Metadata } from "next";

import ProfileForm from "features/auth/components/profile-form";
import PageHeading from "widgets/page-heading";

export const metadata: Metadata = { title: "Profile" };

export default function ProfileRoute() {
  return (
    <div className="container-fluid p-4">
      <PageHeading heading="Profile" />
      <ProfileForm />
    </div>
  );
}
