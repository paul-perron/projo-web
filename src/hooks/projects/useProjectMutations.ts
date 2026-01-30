// src/hooks/projects/useProjectMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { managePositions } from "@/services/api/projects/projects.service";
import type { PositionManageAction } from "@/services/api/projects/projects.service";

type UnknownAction = unknown;

function normalizePositionAction(action: UnknownAction): PositionManageAction {
  if (!action || typeof action !== "object") {
    throw new Error("Invalid position action");
  }

  const a = action as {
    type?: string;
    positionId?: string;
    position?: {
      code?: string;
      name?: string;
      rotation?: string;
      rotation_schedule?: string;
      shift?: string;
    };
    patch?: {
      name?: string;
      code?: string;
      rotation?: string;
      rotation_schedule?: string;
      shift?: string;
      status?: string;
    };
  };

  const type = String(a.type ?? "").toUpperCase();

  if (type === "DELETE" || type === "REMOVE" || type === "INACTIVATE" || type === "DEACTIVATE") {
    if (!a.positionId) throw new Error("positionId is required");
    return { type: "DEACTIVATE", positionId: a.positionId };
  }

  if (type === "ADD") {
    const code = a.position?.code ?? a.position?.name;
    if (!code) throw new Error("Position code is required");
    return {
      type: "ADD",
      position: {
        code,
        rotation: a.position?.rotation ?? a.position?.rotation_schedule,
        shift: a.position?.shift,
      },
    };
  }

  if (type === "UPDATE") {
    if (!a.positionId) throw new Error("positionId is required");
    return {
      type: "UPDATE",
      positionId: a.positionId,
      patch: {
        name: a.patch?.name ?? a.patch?.code,
        rotation_schedule: a.patch?.rotation_schedule ?? a.patch?.rotation,
        shift: a.patch?.shift,
        status: a.patch?.status,
      },
    };
  }

  throw new Error(`Unknown position action type: ${a.type}`);
}

export function useManageProjectPositions(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (action: UnknownAction) =>
      managePositions(projectId, normalizePositionAction(action)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_positions", projectId] });
      qc.invalidateQueries({ queryKey: ["project_positions", "all"] });
    },
  });
}