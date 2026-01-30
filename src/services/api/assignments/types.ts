// src/services/api/assignments/types.ts

export type AssignmentType = "PRIMARY" | "SECONDARY" | "TEMP_COVERAGE";

export type AssignmentStatus =
  | "active"
  | "assigned"
  | "completed"
  | "cancelled"
  | "temporary_leave"
  | string;

export type Assignment = {
  id: string;

  org_id?: string | null;

  project_id: string;
  position_id: string;
  worker_id: string;

  assignment_type: AssignmentType;

  assignment_start_date: string; // ISO date (YYYY-MM-DD)
  assignment_end_date?: string | null;

  ended_at?: string | null;

  // Business fields already in your table
  rotation_schedule?: string | null;
  opcon_supervisor_id?: string | null;

  status?: AssignmentStatus | null;

  pay_rate_override?: number | null;
  charge_rate_override?: number | null;

  notes?: string | null;
  override_reason?: string | null;

  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ListAssignmentsParams = {
  workerId?: string;
  projectId?: string;
  positionId?: string;
  page?: number;
  pageSize?: number;

  includeEnded?: boolean; // default false
  type?: AssignmentType;
};

export type CreateIncumbentAssignmentInput = {
  worker_id: string;
  project_id: string;
  position_id: string;

  assignment_start_date?: string; // default today
  assignment_end_date?: string | null;

  rotation_schedule?: string | null;
  opcon_supervisor_id?: string | null;

  notes?: string | null;

  // SECONDARY only
  override_reason?: string;
};

export type CreateTempCoverageInput = {
  worker_id: string;
  project_id: string;
  position_id: string;

  assignment_start_date: string; // required for coverage
  assignment_end_date: string;   // required for coverage per your constraints
  override_reason: string;       // required for coverage per your constraints

  rotation_schedule?: string | null;
  opcon_supervisor_id?: string | null;

  notes?: string | null;
};

export type EndAssignmentInput = {
  assignmentId: string;
  endStatus?: "completed" | "cancelled";
  endedAtIso?: string; // optional override, default now()
};