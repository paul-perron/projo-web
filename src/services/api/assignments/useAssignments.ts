// src/hooks/assignments/useAssignments.ts
import { useQuery } from "@tanstack/react-query";
import { listAssignments } from "@/services/api/assignments/assignments.service";
import { assignmentsKeys } from "./queryKeys";

export type UseAssignmentsParams = {
  page?: number;
  pageSize?: number;
  workerId?: string;
  opconSupervisorId?: string;
  status?: string;
};

export function useAssignments(params: UseAssignmentsParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  return useQuery({
    queryKey: assignmentsKeys.list({
      page,
      pageSize,
      workerId: params.workerId,
      opconSupervisorId: params.opconSupervisorId,
      status: params.status,
    }),
    queryFn: () => listAssignments({
      page,
      pageSize,
      workerId: params.workerId,
      projectId: undefined,
      positionId: undefined,
      type: undefined,
      includeEnded: false,
    }),
    staleTime: 15_000,
  });
}