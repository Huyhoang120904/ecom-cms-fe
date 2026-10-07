import type { Metadata } from "next";
import type { ReactNode } from "react";

import "styles/theme.scss";

import AppProviders from "app/providers";
import { AuthProvider } from "features/auth/auth-context";

export const metadata: Metadata = {
  title: {
    default: "Seller CMS",
    template: "%s | Seller CMS",
  },
  description: "Seller operations dashboard for the ecommerce platform.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-light">
        <AppProviders>
          <AuthProvider>{children}</AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
