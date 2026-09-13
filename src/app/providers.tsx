import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "lib/query/query-client";

/**
 * Wrap the application in the providers it needs.
 *
 * One QueryClient is created per browser mount so server renders never share
 * cache between requests.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  // Lazy initializer: the client is built once per mount.
  const [queryClient] = useState<QueryClient>(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
