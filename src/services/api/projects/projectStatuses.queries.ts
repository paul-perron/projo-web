import { useQuery } from "@tanstack/react-query";
import { listProjectStatuses } from "./projectStatuses.service";

export const projectStatusKeys = {
  all: ["project_statuses"] as const,
  list: (activeOnly: boolean) => ["project_statuses", { activeOnly }] as const,
};

export function useProjectStatuses(options?: { activeOnly?: boolean; enabled?: boolean }) {
  const activeOnly = options?.activeOnly ?? true;

  return useQuery({
    queryKey: projectStatusKeys.list(activeOnly),
    queryFn: () => listProjectStatuses(activeOnly), // boolean
    enabled: options?.enabled ?? true,
  });
}