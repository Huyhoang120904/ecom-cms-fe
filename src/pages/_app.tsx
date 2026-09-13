import Head from "next/head";
import type { AppProps } from "next/app";

import "styles/theme.scss";

import AppProviders from "app/providers";
import RouteGuard from "app/session/route-guard";
import AppShell from "app/shell/app-shell";
import { AuthProvider } from "features/auth/auth-context";

/**
 * Application root.
 *
 * `AuthProvider` is inside `AppProviders` because it reads the React Query cache,
 * and `RouteGuard` is inside `AuthProvider` because it reads the session status.
 * The shell renders inside the guard so it never appears around a page the seller
 * is about to be redirected away from.
 */
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <AuthProvider>
        <RouteGuard>
          <AppShell>
            <Component {...pageProps} />
          </AppShell>
        </RouteGuard>
      </AuthProvider>
    </AppProviders>
  );
}
