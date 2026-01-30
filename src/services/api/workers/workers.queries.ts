// src/services/api/workers/workers.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createWorker,
  getWorkerById,
  listWorkers,
  updateWorker,
} from "./workers.service";

import type {
  CreateWorkerInput,
  ListWorkersParams,
  UpdateWorkerInput,
  WorkerStatus,
  WorkerType,
} from "./types";

/**
 * List workers query.
 * Note: align UI param naming to service param naming.
 * If your UI uses pageSize, we map it to perPage.
 */
export function useWorkersList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: WorkerStatus;
  workerType?: WorkerType;
}) {
  const serviceParams: ListWorkersParams = {
    page: params.page,
    perPage: params.pageSize, // map pageSize → perPage
    search: params.search,
    status: params.status,
    workerType: params.workerType,
  };

  return useQuery({
    queryKey: ["workers", serviceParams],
    queryFn: () => listWorkers(serviceParams),
  });
}

export function useWorker(workerId: string) {
  return useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => getWorkerById(workerId),
    enabled: !!workerId,
  });
}

export function useCreateWorker() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkerInput) => createWorker(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useUpdateWorker() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ workerId, updates }: { workerId: string; updates: UpdateWorkerInput }) =>
      updateWorker(workerId, updates),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["workers"] });
      qc.invalidateQueries({ queryKey: ["worker", variables.workerId] });
    },
  });
}