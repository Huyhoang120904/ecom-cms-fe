import { QueryClient } from "@tanstack/react-query";

/** Construct the application QueryClient. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server state is owned by the backend; one retry keeps a transient
        // blip from surfacing as an error state.
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
