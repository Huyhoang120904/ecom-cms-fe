import Head from "next/head";
import type { AppProps } from "next/app";

import "styles/theme.scss";

import AppProviders from "app/providers";
import AppShell from "app/shell/app-shell";

/**
 * Application root.
 *
 * Wires the providers and the shell around every page. Route state (loading,
 * error, empty) is owned by the page's feature module.
 */
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </AppProviders>
  );
}
