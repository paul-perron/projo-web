// src/hooks/projects/queryKeys.ts
export const projectsKeys = {
  all: ["projects"] as const,
  lists: () => [...projectsKeys.all, "list"] as const,
  list: (params: { page: number; pageSize: number; search?: string; customerId?: string; status?: string }) =>
    [...projectsKeys.lists(), params] as const,
  details: () => [...projectsKeys.all, "detail"] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
  positions: (projectId: string) => [...projectsKeys.all, "positions", projectId] as const,
};