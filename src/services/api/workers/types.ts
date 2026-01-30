// src/services/workers/types.ts
import type { ISODateString } from "../_shared/types";

export type WorkerType = "w2" | "contractor";
export type WorkerStatus = "available" | "assigned" | "on_leave" | "terminated" | "not_eligible" | "past";

export interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  worker_type: WorkerType;
  iss_email: string;
  hire_date: ISODateString;
  status: WorkerStatus;
  adcon_supervisor_id: string;

  // Optional fields
  personal_email?: string | null;
  phone?: string | null;

  created_at: string;
  updated_at: string;
}

export type CreateWorkerInput = Omit<
  Worker,
  "id" | "created_at" | "updated_at"
>;

export type UpdateWorkerInput = Partial<Omit<Worker, "id" | "created_at" | "updated_at">>;

export interface ListWorkersParams {
  search?: string;
  status?: WorkerStatus;
  workerType?: WorkerType;
  page?: number;
  perPage?: number;
}