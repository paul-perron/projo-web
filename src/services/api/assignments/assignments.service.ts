// src/services/api/assignments/assignments.service.ts

import { api } from "../_shared/supabase";
import { AppError, assertOk } from "../_shared/errors";

import type {
  Assignment,
  AssignmentType,
  CreateIncumbentAssignmentInput,
  CreateTempCoverageInput,
  EndAssignmentInput,
  ListAssignmentsParams,
} from "./types";

/**
 * Internal helper: normalize empty strings to null
 */
function toNullIfBlank(v?: string | null) {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

function rotationOrDefault(v?: string | null) {
  const s = (v ?? "").trim();
  return s.length ? s : "14/14";
}

/**
 * Internal helper: today as YYYY-MM-DD (local)
 */
function todayIsoDate(): string {
  // Using local date; aligns with typical UI date inputs
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * List assignments with optional filters.
 *
 * IMPORTANT:
 * - Active = ended_at IS NULL
 * - All = includeEnded = true
 * - Filters use *camelCase* param names (projectId/workerId/positionId/type)
 *   which we translate into DB columns (project_id/worker_id/position_id/assignment_type)
 */
export async function listAssignments(params: ListAssignmentsParams = {}): Promise<Assignment[]> {
  const {
    includeEnded = false,
    workerId,
    projectId,
    positionId,
    type,
    page,
    pageSize,
  } = params;

  let q = api
    .schema("api")
    .from("assignments")
    .select("*")
    // consistent ordering (most recent first)
    .order("assignment_start_date", { ascending: false });

  // Active vs All
  if (!includeEnded) {
    q = q.is("ended_at", null);
  }

  // Optional filters
  if (workerId) q = q.eq("worker_id", workerId);
  if (projectId) q = q.eq("project_id", projectId);
  if (positionId) q = q.eq("position_id", positionId);
  if (type) q = q.eq("assignment_type", type as AssignmentType);

  // Optional pagination
  if (page && pageSize) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);
  }

  const res = await q;

  if (res.error) throw new AppError("DB_ERROR", res.error.message);
  return (res.data ?? []) as Assignment[];
}

export async function listAssignmentsByWorker(
  workerId: string,
  includeEnded = false
): Promise<Assignment[]> {
  return listAssignments({ workerId, includeEnded });
}

export async function listAssignmentsByProject(
  projectId: string,
  includeEnded = false
): Promise<Assignment[]> {
  return listAssignments({ projectId, includeEnded });
}

export async function listAssignmentsByPosition(
  positionId: string,
  includeEnded = false
): Promise<Assignment[]> {
  return listAssignments({ positionId, includeEnded });
}

/**
 * Returns the active incumbent (PRIMARY/SECONDARY) for a position, if any.
 */
export async function getActiveIncumbentForPosition(positionId: string): Promise<Assignment | null> {
  if (!positionId?.trim()) return null;

  const res = await api
    .schema("api")
    .from("assignments")
    .select("*")
    .eq("position_id", positionId)
    .in("assignment_type", ["PRIMARY", "SECONDARY"])
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (res.error) throw new AppError("DB_ERROR", res.error.message, res.error);
  return (res.data?.[0] as Assignment) ?? null;
}

/**
 * Create PRIMARY assignment (incumbent).
 * DB unique index enforces: one active PRIMARY per worker.
 * DB unique index enforces: one active incumbent per position.
 */
export async function assignPrimary(input: CreateIncumbentAssignmentInput): Promise<Assignment> {
  if (!input?.worker_id?.trim()) throw new AppError("VALIDATION_ERROR", "worker_id is required.");
  if (!input?.project_id?.trim()) throw new AppError("VALIDATION_ERROR", "project_id is required.");
  if (!input?.position_id?.trim()) throw new AppError("VALIDATION_ERROR", "position_id is required.");

  const payload = {
    worker_id: input.worker_id,
    project_id: input.project_id,
    position_id: input.position_id,

    assignment_type: "PRIMARY" as AssignmentType,

    assignment_start_date: input.assignment_start_date ?? todayIsoDate(),
    assignment_end_date: input.assignment_end_date ?? null,

    rotation_schedule: rotationOrDefault(input.rotation_schedule),
    opcon_supervisor_id: toNullIfBlank(input.opcon_supervisor_id),

    status: "active",

    notes: toNullIfBlank(input.notes),
    override_reason: null,
    ended_at: null,
  };

  const res = await api
    .schema("api")
    .from("assignments")
    .insert([payload])
    .select("*")
    .single();

  return assertOk(res) as Assignment;
}

/**
 * Create SECONDARY assignment (incumbent with override).
 * Requires override_reason (DB constraint enforces too).
 */
export async function assignSecondary(input: CreateIncumbentAssignmentInput): Promise<Assignment> {
  if (!input?.worker_id?.trim()) throw new AppError("VALIDATION_ERROR", "worker_id is required.");
  if (!input?.project_id?.trim()) throw new AppError("VALIDATION_ERROR", "project_id is required.");
  if (!input?.position_id?.trim()) throw new AppError("VALIDATION_ERROR", "position_id is required.");

  const reason = toNullIfBlank(input.override_reason);
  if (!reason) throw new AppError("VALIDATION_ERROR", "override_reason is required for SECONDARY.");

  const payload = {
    worker_id: input.worker_id,
    project_id: input.project_id,
    position_id: input.position_id,

    assignment_type: "SECONDARY" as AssignmentType,

    assignment_start_date: input.assignment_start_date ?? todayIsoDate(),
    assignment_end_date: input.assignment_end_date ?? null,

    rotation_schedule: rotationOrDefault(input.rotation_schedule),
    opcon_supervisor_id: toNullIfBlank(input.opcon_supervisor_id),

    status: "active",

    notes: toNullIfBlank(input.notes),
    override_reason: reason,
    ended_at: null,
  };

  const res = await api
    .schema("api")
    .from("assignments")
    .insert([payload])
    .select("*")
    .single();

  return assertOk(res) as Assignment;
}

/**
 * Create TEMP_COVERAGE (overlaps incumbent by design).
 * Requires assignment_start_date, assignment_end_date, override_reason (reason).
 */
export async function startTempCoverage(input: CreateTempCoverageInput): Promise<Assignment> {
  if (!input?.worker_id?.trim()) throw new AppError("VALIDATION_ERROR", "worker_id is required.");
  if (!input?.project_id?.trim()) throw new AppError("VALIDATION_ERROR", "project_id is required.");
  if (!input?.position_id?.trim()) throw new AppError("VALIDATION_ERROR", "position_id is required.");
  if (!input.assignment_start_date?.trim())
    throw new AppError("VALIDATION_ERROR", "assignment_start_date is required for TEMP_COVERAGE.");
  if (!input.assignment_end_date?.trim())
    throw new AppError("VALIDATION_ERROR", "assignment_end_date is required for TEMP_COVERAGE.");
  if (!toNullIfBlank(input.override_reason))
    throw new AppError("VALIDATION_ERROR", "override_reason is required for TEMP_COVERAGE.");

  const payload = {
    worker_id: input.worker_id,
    project_id: input.project_id,
    position_id: input.position_id,

    assignment_type: "TEMP_COVERAGE" as AssignmentType,

    assignment_start_date: input.assignment_start_date,
    assignment_end_date: input.assignment_end_date,

    rotation_schedule: toNullIfBlank(input.rotation_schedule),
    opcon_supervisor_id: toNullIfBlank(input.opcon_supervisor_id),

    status: "active",

    notes: toNullIfBlank(input.notes),
    override_reason: toNullIfBlank(input.override_reason),
    ended_at: null,
  };

  const res = await api
    .schema("api")
    .from("assignments")
    .insert([payload])
    .select("*")
    .single();

  return assertOk(res) as Assignment;
}

/**
 * End an assignment (history preserved).
 * We set ended_at and set status to completed/cancelled to keep legacy triggers working.
 */
export async function endAssignment(input: EndAssignmentInput): Promise<Assignment> {
  if (!input?.assignmentId?.trim())
    throw new AppError("VALIDATION_ERROR", "assignmentId is required.");

  const endStatus = input.endStatus ?? "completed";

  const patch = {
    ended_at: input.endedAtIso ?? new Date().toISOString(),
    status: endStatus,
  };

  const res = await api
    .schema("api")
    .from("assignments")
    .update(patch)
    .eq("id", input.assignmentId)
    .select("*")
    .single();

  return assertOk(res) as Assignment;
}