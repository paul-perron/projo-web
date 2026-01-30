// src/services/api/projects/projects.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listProjects,
  getProject,
  listProjectPositions,
  getProjectOpconSupervisorId,
  createProject,
  updateProject,
} from "./projects.service";

// ----------------------------------------------------------------------------
// Query keys (keep stable + centralized)
// ----------------------------------------------------------------------------
export const projectsKeys = {
  all: ["projects"] as const,

  list: (params: Parameters<typeof listProjects>[0]) => ["projects", params] as const,

  project: (projectId: string) => ["project", projectId] as const,

  positions: (projectId: string) => ["project_positions", projectId] as const,

  opconSupervisor: (projectId: string) => ["project_opcon_supervisor", projectId] as const,
};

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------
export function useProjectsList(params: Parameters<typeof listProjects>[0] = {}) {
  return useQuery({
    queryKey: projectsKeys.list(params),
    queryFn: () => listProjects(params),
  });
}

export function useProject(projectId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectsKeys.project(projectId),
    queryFn: () => getProject(projectId),
    enabled: options?.enabled ?? true,
  });
}

export function useProjectPositions(projectId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectsKeys.positions(projectId),
    queryFn: () => listProjectPositions(projectId),
    enabled: options?.enabled ?? true,
  });
}

export function useProjectOpconSupervisorId(projectId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectsKeys.opconSupervisor(projectId),
    queryFn: () => getProjectOpconSupervisorId(projectId),
    enabled: options?.enabled ?? true,
  });
}

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------
export function useCreateProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof createProject>[0]) => createProject(payload),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      // Optional: warm cache for detail page
      qc.setQueryData(projectsKeys.project(created.id), created);
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { projectId: string; patch: Parameters<typeof updateProject>[1] }) =>
      updateProject(args.projectId, args.patch),
    onSuccess: (_data, vars) => {
      // refresh project + list + positions
      qc.invalidateQueries({ queryKey: projectsKeys.all });
      qc.invalidateQueries({ queryKey: projectsKeys.project(vars.projectId) });
      qc.invalidateQueries({ queryKey: projectsKeys.positions(vars.projectId) });
    },
  });
}