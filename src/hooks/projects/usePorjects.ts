// src/hooks/projects/useProjects.ts
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/services/api/projects/projects.service";
import { projectsKeys } from "./queryKeys";

export type UseProjectsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  customerId?: string;
  status?: string;
};

export function useProjects(params: UseProjectsParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  const search = params.search?.trim() || undefined;
  const customerId = params.customerId || undefined;
  const status = params.status || undefined;

  return useQuery({
    queryKey: projectsKeys.list({ page, pageSize, search, customerId, status }),
    queryFn: () => listProjects({ page, pageSize, search, customerId, status }),
    staleTime: 30_000,
  });
}