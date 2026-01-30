// src/services/api/projects/projectPositions.queries.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../_shared/supabase";
import { AppError } from "../_shared/errors";

export type ProjectPositionLite = {
  id: string;
  project_id: string;
  name: string | null;
  shift: string | null;
  rotation_schedule: string | null;
  status: string | null;
};

export const projectPositionKeys = {
  all: ["project_positions"] as const,
  list: (projectId: string) => ["project_positions", { projectId }] as const,
  allPositions: () => ["project_positions", "all"] as const,
};

export function useAllProjectPositions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectPositionKeys.allPositions(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await api
        .from("project_positions")
        .select("id, project_id, name, shift, rotation_schedule, status")
        .order("name", { ascending: true });

      if (res.error) throw new AppError("DB_ERROR", res.error.message, res.error);
      return (res.data ?? []) as ProjectPositionLite[];
    },
  });
}