import { useQuery } from "@tanstack/react-query";

import { fetchLiveness, fetchReadiness } from "./api";
import { dashboardKeys } from "./query-keys";

/** Real backend status queries used by the dashboard page. */

export function useLivenessQuery() {
  return useQuery({
    queryKey: dashboardKeys.liveness(),
    queryFn: fetchLiveness,
    refetchInterval: 30_000,
  });
}

export function useReadinessQuery() {
  return useQuery({
    queryKey: dashboardKeys.readiness(),
    queryFn: fetchReadiness,
    refetchInterval: 30_000,
  });
}
