// src/services/workers/workers.service.ts
import { api } from "../_shared/supabase";
import { assertOk, AppError } from "../_shared/errors";
import { logAudit } from "../_shared/audit";
import type { Worker, CreateWorkerInput, UpdateWorkerInput, ListWorkersParams } from "./types";

export async function listWorkers(params: ListWorkersParams = {}): Promise<Worker[]> {
  let q = api.from("workers").select("*").order("last_name", { ascending: true });

  if (params.search) {
    const like = `%${params.search}%`;
    q = q.or(`first_name.ilike.${like},last_name.ilike.${like}`);
  }
  if (params.status) q = q.eq("status", params.status);
  if (params.workerType) q = q.eq("worker_type", params.workerType);

  // Pagination (optional)
  if (params.page && params.perPage) {
    const from = (params.page - 1) * params.perPage;
    const to = from + params.perPage - 1;
    q = q.range(from, to);
  }

  const res = await q;
  return assertOk(res) as Worker[];
}

export async function getWorkerById(id: string): Promise<Worker> {
  const res = await api.from("workers").select("*").eq("id", id).single();
  const data = assertOk(res) as Worker;
  if (!data) throw new AppError("NOT_FOUND", "Worker not found.");
  return data;
}

export async function createWorker(input: CreateWorkerInput): Promise<Worker> {
  const res = await api.from("workers").insert(input).select("*").single();
  const worker = assertOk(res) as Worker;

  await logAudit({
    entity_type: "worker",
    entity_id: worker.id,
   action: "CREATE",
  });

  return worker;
}

export async function updateWorker(id: string, patch: UpdateWorkerInput): Promise<Worker> {
  // Read current record (for audit diffing)
  const before = await getWorkerById(id);

  const res = await api.from("workers").update(patch).eq("id", id).select("*").single();
  const after = assertOk(res) as Worker;

  // Minimal audit: 1 record for update (you can expand to per-field later)
  await logAudit({
    entity_type: "worker",
    entity_id: id,
action: "UPDATE",
    old_value: JSON.stringify(before),
    new_value: JSON.stringify(after),
  });

  return after;
}