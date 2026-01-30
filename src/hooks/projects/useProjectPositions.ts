// src/hooks/projects/useProjectPositions.ts
import { useQuery } from "@tanstack/react-query";
import { listProjectPositions } from "@/services/api/projects/projects.service";
import { projectsKeys } from "./queryKeys";

export function useProjectPositions(projectId?: string) {
  return useQuery({
    queryKey: projectId ? projectsKeys.positions(projectId) : ["projects", "positions", "missing-id"],
    queryFn: () => {
      if (!projectId) throw new Error("projectId is required");
      return listProjectPositions(projectId);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}