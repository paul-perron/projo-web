// src/hooks/assignments/queryKeys.ts
export const assignmentsKeys = {
  all: ["assignments"] as const,
  lists: () => [...assignmentsKeys.all, "list"] as const,
  list: (params: {
    page: number;
    pageSize: number;
    workerId?: string;
    opconSupervisorId?: string;
    status?: string;
  }) => [...assignmentsKeys.lists(), params] as const,
  details: () => [...assignmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...assignmentsKeys.details(), id] as const,
};