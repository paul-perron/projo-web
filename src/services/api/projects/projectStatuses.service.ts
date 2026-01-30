// src/services/api/projects/projectStatuses.service.ts
import { api } from "../_shared/supabase";
import { AppError } from "../_shared/errors";

export type ProjectStatusRow = {
  id: string;
  label: string | null;
  code: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  is_closed: boolean | null;
};

export async function listProjectStatuses(activeOnly = true): Promise<ProjectStatusRow[]> {
  let q = api
    .from("project_statuses")
    .select("*");

  if (activeOnly) {
    q = q.eq("is_active", true);
  }

  q = q.order("sort_order", { ascending: true });

  const res = await q;
  if (res.error) throw new AppError("DB_ERROR", res.error.message, res.error);
  return (res.data ?? []) as ProjectStatusRow[];
}

export async function getActiveProjectStatusId(): Promise<string | null> {
  const rows = await listProjectStatuses(true);
  const active =
    rows.find((r) => (r.code ?? "").toLowerCase() === "active") ??
    rows.find((r) => (r.label ?? "").toLowerCase() === "active");
  return active?.id ?? null;
}