// src/services/api/assignments/assignments.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

import {
  assignPrimary,
  assignSecondary,
  endAssignment,
  getActiveIncumbentForPosition,
  listAssignments,
  listAssignmentsByProject,
  listAssignmentsByPosition,
  listAssignmentsByWorker,
  startTempCoverage,
} from "./assignments.service";

import type {
  Assignment,
  AssignmentType,
  CreateIncumbentAssignmentInput,
  CreateTempCoverageInput,
  EndAssignmentInput,
  ListAssignmentsParams,
} from "./types";

/**
 * Queries
 */
export function useAssignmentsList(params: ListAssignmentsParams = {}) {
  return useQuery({
    queryKey: ["assignments", "list", params],
    queryFn: () => listAssignments(params),
  });
}

export function useAssignmentsByWorker(workerId: string, includeEnded = false) {
  return useQuery({
    queryKey: ["assignments", "worker", workerId, includeEnded],
    queryFn: () => listAssignmentsByWorker(workerId, includeEnded),
    enabled: Boolean(workerId),
  });
}

export function useAssignmentsByProject(projectId: string, includeEnded = false) {
  return useQuery({
    queryKey: ["assignments", "project", projectId, includeEnded],
    queryFn: () => listAssignmentsByProject(projectId, includeEnded),
    enabled: Boolean(projectId),
  });
}

export function useAssignmentsByPosition(positionId: string, includeEnded = false) {
  return useQuery({
    queryKey: ["assignments", "position", positionId, includeEnded],
    queryFn: () => listAssignmentsByPosition(positionId, includeEnded),
    enabled: Boolean(positionId),
  });
}

/**
 * Active assignment helper
 * Returns the most recent active assignment for a worker (or null).
 */
export function useWorkerActiveAssignment(workerId: string) {
  return useQuery({
    queryKey: ["assignments", "worker", workerId, "active"],
    queryFn: async () => {
      const items = await listAssignmentsByWorker(workerId, false);
      return items[0] ?? null;
    },
    enabled: Boolean(workerId),
  });
}

/**
 * Active incumbent helper
 * Returns active incumbent assignment (PRIMARY/SECONDARY) for a position (or null).
 */
export function useActiveIncumbentForPosition(positionId: string) {
  return useQuery({
    queryKey: ["assignments", "position", positionId, "active-incumbent"],
    queryFn: () => getActiveIncumbentForPosition(positionId),
    enabled: Boolean(positionId),
  });
}

/**
 * Internal helper for invalidation
 */
function invalidateAssignmentQueries(qc: ReturnType<typeof useQueryClient>, a: any) {
  qc.invalidateQueries({ queryKey: ["assignments"] });

  if (a?.worker_id) qc.invalidateQueries({ queryKey: ["assignments", "worker", a.worker_id] });
  if (a?.project_id) qc.invalidateQueries({ queryKey: ["assignments", "project", a.project_id] });
  if (a?.position_id) qc.invalidateQueries({ queryKey: ["assignments", "position", a.position_id] });
}

/**
 * Mutations
 */
export function useAssignPrimary(
  options?: UseMutationOptions<Assignment, Error, CreateIncumbentAssignmentInput, unknown>
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload) => assignPrimary(payload),
    onSuccess: (a) => invalidateAssignmentQueries(qc, a),
    ...options, // ✅ allow caller to override/extend if they want
  });
}

export function useAssignSecondary() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIncumbentAssignmentInput) => assignSecondary(payload),
    onSuccess: (a) => invalidateAssignmentQueries(qc, a),
  });
}

export function useStartTempCoverage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTempCoverageInput) => startTempCoverage(payload),
    onSuccess: (a) => invalidateAssignmentQueries(qc, a),
  });
}

/**
 * UI-facing mutation: accepts camelCase payload and maps to service snake_case.
 * This is what your `NewAssignmentModal` is using.
 */
export function useAssignWorker() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      assignmentType: AssignmentType; // "PRIMARY" | "SECONDARY" | "TEMP_COVERAGE"

      workerId: string;
      projectId: string;
      positionId: string;

      assignmentStartDate?: string;
      assignmentEndDate?: string | null;

      overrideReason?: string;
      rotationSchedule?: string | null;
      opconSupervisorId?: string | null;
      notes?: string | null;
    }) => {
      if (payload.assignmentType === "TEMP_COVERAGE") {
        return startTempCoverage({
          worker_id: payload.workerId,
          project_id: payload.projectId,
          position_id: payload.positionId,
          assignment_start_date: payload.assignmentStartDate!,
          assignment_end_date: payload.assignmentEndDate as string,
          override_reason: payload.overrideReason!,
          rotation_schedule: payload.rotationSchedule ?? null,
          opcon_supervisor_id: payload.opconSupervisorId ?? null,
          notes: payload.notes ?? null,
        } as CreateTempCoverageInput);
      }

      const base: CreateIncumbentAssignmentInput = {
        worker_id: payload.workerId,
        project_id: payload.projectId,
        position_id: payload.positionId,
        assignment_start_date: payload.assignmentStartDate,
        assignment_end_date: payload.assignmentEndDate ?? null,
        rotation_schedule: payload.rotationSchedule ?? null,
        opcon_supervisor_id: payload.opconSupervisorId ?? null,
        notes: payload.notes ?? null,
        override_reason: payload.overrideReason,
      };

      return payload.assignmentType === "SECONDARY" ? assignSecondary(base) : assignPrimary(base);
    },

    onSuccess: (a) => invalidateAssignmentQueries(qc, a),
  });
}

/**
 * Compatibility hook used by AssignmentsListPage to "complete" an assignment.
 */
export function useCompleteAssignment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: EndAssignmentInput) => endAssignment(payload),
    onSuccess: (a) => invalidateAssignmentQueries(qc, a),
  });
}

export function useEndAssignment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: EndAssignmentInput) => endAssignment(payload),
    onSuccess: (a) => invalidateAssignmentQueries(qc, a),
  });
}