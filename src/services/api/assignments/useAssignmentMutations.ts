// src/hooks/assignments/useAssignmentMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignWorker,
  completeAssignment,
  swapAssignments,
} from "@/services/api/assignments/assignments.service";
import { assignmentsKeys } from "./queryKeys";

export function useAssignmentMutations() {
  const qc = useQueryClient();

  const invalidateAll = async () => {
    await qc.invalidateQueries({ queryKey: assignmentsKeys.all });
  };

  const assign = useMutation({
    mutationFn: assignWorker,
    onSuccess: async (created) => {
      await invalidateAll();
      qc.setQueryData(assignmentsKeys.detail(created.id), created);
    },
  });

  const complete = useMutation({
    mutationFn: completeAssignment,
    onSuccess: async (updated) => {
      await invalidateAll();
      qc.setQueryData(assignmentsKeys.detail(updated.id), updated);
    },
  });

  const swap = useMutation({
    mutationFn: swapAssignments,
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  return { assign, complete, swap };
}