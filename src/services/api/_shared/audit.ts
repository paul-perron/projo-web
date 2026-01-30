// src/services/api/_shared/audit.ts
import { api } from "./supabase";
import { AppError } from "./errors";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DEACTIVATE"
  | "REACTIVATE"
  | "STATUS_CHANGE"
  | "ASSIGN"
  | "UNASSIGN"
  | "SWAP"
  | "COMPLETE"
  | "CANCEL"
  | "UPLOAD"
  | "DELETE";

export type AuditLogInput = {
  entity_type: string;
  entity_id: string;
  action: AuditAction;

  field_changed?: string | null;

  // Store as JSONB in DB
  old_value?: unknown | null;
  new_value?: unknown | null;

  note?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAudit(input: AuditLogInput): Promise<{ id: string }> {
  const res = await api
    .from("audit_logs")
    .insert({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      field_changed: input.field_changed ?? null,
      old_value: input.old_value ?? null,
      new_value: input.new_value ?? null,
      note: input.note ?? null,
      metadata: input.metadata ?? null,
    })
    .select("id")
    .single();

  if (res.error) throw new AppError("DB_ERROR", res.error.message, res.error);
  return res.data as { id: string };
}