// src/services/api/projects/projects.service.ts

/**
 * Projects service (Supabase "api" schema)
 *
 * What this owns:
 * - Project CRUD (no deletes; status drives lifecycle)
 * - Position CRUD (no hard deletes; deactivate instead)
 * - OPCON supervisor lookup for assignment creation
 *
 * Status behavior:
 * - status_id is sourced from DB (project_statuses).
 * - If caller doesn’t provide status_id, we auto-select the "Active" status.
 */

import { api } from "../_shared/supabase";
import { AppError, assertOk } from "../_shared/errors";
import { logAudit } from "../_shared/audit";
import { toRange, type ListParams } from "../_shared/pagination";
import { getActiveProjectStatusId } from "./projectStatuses.service";

// ============================================================================
// OPCON SUPERVISOR RESOLUTION
// ============================================================================

/**
 * Resolve a project's OPCON supervisor.
 * Priority: Sub-customer account manager -> Customer account manager -> null
 */
export async function getProjectOpconSupervisorId(projectId: string): Promise<string | null> {
  if (!projectId?.trim()) return null;

  const projRes = await api
    .from("projects")
    .select("id, customer_id, sub_customer_id")
    .eq("id", projectId)
    .single();

  const project = assertOk(projRes) as {
    customer_id: string | null;
    sub_customer_id: string | null;
  };

  if (project.sub_customer_id) {
    const scRes = await api
      .from("sub_customers")
      .select("account_manager_worker_id")
      .eq("id", project.sub_customer_id)
      .single();

    const sc = scRes.error ? null : scRes.data;
    if (sc?.account_manager_worker_id) return sc.account_manager_worker_id as string;
  }

  if (project.customer_id) {
    const cRes = await api
      .from("customers")
      .select("account_manager_worker_id")
      .eq("id", project.customer_id)
      .single();

    const c = cRes.error ? null : cRes.data;
    if (c?.account_manager_worker_id) return c.account_manager_worker_id as string;
  }

  return null;
}

// ============================================================================
// TYPES
// ============================================================================

export type Project = {
  id: string;
  customer_id: string;
  sub_customer_id?: string | null;

  project_name: string;
  wbs_code?: string | null;

  start_date?: string | null;
  end_date?: string | null;

  positions_required?: number | null;
  default_rotation?: string | null;

  status_id?: string | null;

  special_requirements?: string | null;
  safety_requirements?: string | null;
  notes?: string | null;

  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProjectPositionStatus = "active" | "inactive" | string;

export type ProjectPosition = {
  id: string;
  project_id: string;

  name: string;
  shift?: string | null;
  rotation_schedule?: string | null;

  status?: ProjectPositionStatus;
  notes?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type ProjectCreate = {
  customer_id: string;
  sub_customer_id?: string | null;

  project_name: string;
  wbs_code?: string | null;

  start_date?: string | null;
  end_date?: string | null;

  positions_required?: number | null;
  default_rotation?: string | null;

  status_id?: string | null;

  special_requirements?: string | null;
  safety_requirements?: string | null;
  notes?: string | null;

  positions?: Array<{
    code: string;
    rotation?: string;
    shift?: string;
  }>;
};

export type ProjectUpdate = Partial<Omit<ProjectCreate, "positions">>;

export type PositionManageAction =
  | {
      type: "ADD";
      position: { code: string; rotation?: string; shift?: string };
    }
  | {
      type: "UPDATE";
      positionId: string;
      patch: Partial<Pick<ProjectPosition, "name" | "rotation_schedule" | "shift" | "status">>;
    }
  | {
      type: "DEACTIVATE";
      positionId: string;
    };

// ============================================================================
// UTILS
// ============================================================================

function normalizeSearch(search?: string) {
  const s = (search ?? "").trim();
  return s.length ? s : undefined;
}

function defaultPositions(): ProjectCreate["positions"] {
  return [
    { code: "D1", shift: "day" },
    { code: "D2", shift: "day" },
    { code: "N1", shift: "night" },
    { code: "N2", shift: "night" },
  ];
}

// ============================================================================
// QUERIES
// ============================================================================

export async function listProjects(
  params: ListParams & { customerId?: string; statusId?: string } = {}
) {
  const { from, to, page, pageSize } = toRange(params.page, params.pageSize);
  const search = normalizeSearch(params.search);

  let q = api
    .from("projects")
    .select("*", { count: "exact" })
    .order("project_name", { ascending: true })
    .range(from, to);

  if (params.customerId) q = q.eq("customer_id", params.customerId);
  if (params.statusId) q = q.eq("status_id", params.statusId);
  if (search) q = q.ilike("project_name", `%${search}%`);

  const result = await q;

  // list endpoints should return empty arrays without throwing
  if (result.error) throw new AppError("DB_ERROR", result.error.message, result.error);

  return {
    data: (result.data ?? []) as Project[],
    count: result.count ?? 0,
    page,
    pageSize,
  };
}

export async function getProject(projectId: string) {
  if (!projectId?.trim()) throw new AppError("VALIDATION_ERROR", "projectId is required.");

  const result = await api.from("projects").select("*").eq("id", projectId).single();
  return assertOk(result) as Project;
}

export async function listProjectPositions(projectId: string) {
  if (!projectId?.trim()) throw new AppError("VALIDATION_ERROR", "projectId is required.");

  const result = await api
    .from("project_positions")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (result.error) throw new AppError("DB_ERROR", result.error.message, result.error);
  return (result.data ?? []) as ProjectPosition[];
}

// ============================================================================
// MUTATIONS
// ============================================================================

export async function createProject(payload: ProjectCreate) {
  if (!payload?.customer_id?.trim()) {
    throw new AppError("VALIDATION_ERROR", "customer_id is required.");
  }
  if (!payload?.project_name?.trim()) {
    throw new AppError("VALIDATION_ERROR", "Project name is required.");
  }

  // If caller didn't provide status_id, default to the DB "Active" status.
  const defaultStatusId = payload.status_id ?? (await getActiveProjectStatusId());
  if (!defaultStatusId) {
    throw new AppError(
      "DB_ERROR",
      "No active Project Status found. Add an 'Active' row in project_statuses."
    );
  }

  // 1) Insert project
  const insertProjectRes = await api
    .from("projects")
    .insert([
      {
        customer_id: payload.customer_id,
        sub_customer_id: payload.sub_customer_id ?? null,

        project_name: payload.project_name.trim(),
        wbs_code: payload.wbs_code ?? null,

        start_date: payload.start_date ?? null,
        end_date: payload.end_date ?? null,

        positions_required: payload.positions_required ?? 4,
        default_rotation: payload.default_rotation ?? "14/14",

        status_id: defaultStatusId,

        special_requirements: payload.special_requirements ?? null,
        safety_requirements: payload.safety_requirements ?? null,
        notes: payload.notes ?? null,
      },
    ])
    .select("*")
    .single();

  const project = assertOk(insertProjectRes) as Project;

  // 2) Insert positions (provided or default template)
  const positions = (payload.positions?.length ? payload.positions : defaultPositions()) ?? [];
  if (positions.length) {
    const posInsert = await api.from("project_positions").insert(
      positions.map((p) => ({
        project_id: project.id,
        name: p.code.trim(),
        shift: p.shift ?? null,
        rotation_schedule: p.rotation ?? (payload.default_rotation ?? "14/14"),
        status: "active",
      }))
    );

    if (posInsert.error) throw new AppError("DB_ERROR", posInsert.error.message, posInsert.error);
  }

  // 3) Audit
  await logAudit({
    entity_type: "project",
    entity_id: project.id,
    action: "CREATE",
    new_value: {
      project_name: project.project_name,
      customer_id: project.customer_id,
      sub_customer_id: project.sub_customer_id ?? null,
      status_id: project.status_id ?? null,
    },
  });

  return project;
}

export async function updateProject(projectId: string, patch: ProjectUpdate) {
  if (!projectId?.trim()) throw new AppError("VALIDATION_ERROR", "projectId is required.");

  const before = await getProject(projectId);

  const updateRes = await api
    .from("projects")
    .update({
      ...(patch.project_name !== undefined ? { project_name: patch.project_name?.trim() } : {}),
      ...(patch.customer_id !== undefined ? { customer_id: patch.customer_id } : {}),
      ...(patch.sub_customer_id !== undefined ? { sub_customer_id: patch.sub_customer_id } : {}),
      ...(patch.wbs_code !== undefined ? { wbs_code: patch.wbs_code } : {}),
      ...(patch.start_date !== undefined ? { start_date: patch.start_date } : {}),
      ...(patch.end_date !== undefined ? { end_date: patch.end_date } : {}),
      ...(patch.positions_required !== undefined ? { positions_required: patch.positions_required } : {}),
      ...(patch.default_rotation !== undefined ? { default_rotation: patch.default_rotation } : {}),
      ...(patch.status_id !== undefined ? { status_id: patch.status_id } : {}),
      ...(patch.special_requirements !== undefined ? { special_requirements: patch.special_requirements } : {}),
      ...(patch.safety_requirements !== undefined ? { safety_requirements: patch.safety_requirements } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    })
    .eq("id", projectId)
    .select("*")
    .single();

  const after = assertOk(updateRes) as Project;

  await logAudit({
    entity_type: "project",
    entity_id: projectId,
    action: "UPDATE",
    old_value: before,
    new_value: after,
  });

  return after;
}

// ============================================================================
// POSITION MANAGEMENT
// ============================================================================

export async function managePositions(projectId: string, action: PositionManageAction) {
  if (!projectId?.trim()) throw new AppError("VALIDATION_ERROR", "projectId is required.");

  switch (action.type) {
    case "ADD": {
      const code = action.position.code?.trim();
      if (!code) throw new AppError("VALIDATION_ERROR", "Position code is required.");

      const insert = await api
        .from("project_positions")
        .insert([
          {
            project_id: projectId,
            name: code,
            rotation_schedule: action.position.rotation ?? "14/14",
            shift: action.position.shift ?? null,
            status: "active",
          },
        ])
        .select("*")
        .single();

      const created = assertOk(insert) as ProjectPosition;

      await logAudit({
        entity_type: "project_position",
        entity_id: created.id,
        action: "CREATE",
        new_value: created,
        metadata: { project_id: projectId },
      });

      return created;
    }

    case "UPDATE": {
      if (!action.positionId?.trim()) throw new AppError("VALIDATION_ERROR", "positionId is required.");

      const beforeRes = await api
        .from("project_positions")
        .select("*")
        .eq("id", action.positionId)
        .single();
      const before = assertOk(beforeRes) as ProjectPosition;

      const patch = action.patch ?? {};

      const update = await api
        .from("project_positions")
        .update({
          ...(patch.name !== undefined ? { name: patch.name?.trim() } : {}),
          ...(patch.rotation_schedule !== undefined ? { rotation_schedule: patch.rotation_schedule } : {}),
          ...(patch.shift !== undefined ? { shift: patch.shift } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
        })
        .eq("id", action.positionId)
        .select("*")
        .single();

      const after = assertOk(update) as ProjectPosition;

      await logAudit({
        entity_type: "project_position",
        entity_id: action.positionId,
        action: "UPDATE",
        old_value: before,
        new_value: after,
      });

      return after;
    }

    case "DEACTIVATE": {
      if (!action.positionId?.trim()) throw new AppError("VALIDATION_ERROR", "positionId is required.");

      const beforeRes = await api
        .from("project_positions")
        .select("*")
        .eq("id", action.positionId)
        .single();
      const before = assertOk(beforeRes) as ProjectPosition;

      const update = await api
        .from("project_positions")
        .update({ status: "inactive" })
        .eq("id", action.positionId)
        .select("*")
        .single();

      const after = assertOk(update) as ProjectPosition;

      await logAudit({
        entity_type: "project_position",
        entity_id: action.positionId,
        action: "DEACTIVATE",
        old_value: before,
        new_value: after,
        metadata: { project_id: projectId },
      });

      return after;
    }

    default: {
      const _exhaustive: never = action;
      throw new AppError("VALIDATION_ERROR", `Unknown position action: ${String(_exhaustive)}`);
    }
  }
}