// src/hooks/projects/useProject.ts
import { useQuery } from "@tanstack/react-query";
import { getProject } from "@/services/api/projects/projects.service";
import { projectsKeys } from "./queryKeys";

export function useProject(projectId?: string) {
  return useQuery({
    queryKey: projectId ? projectsKeys.detail(projectId) : ["projects", "detail", "missing-id"],
    queryFn: () => {
      if (!projectId) throw new Error("projectId is required");
      return getProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}