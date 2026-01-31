import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useProjectsList } from "../../services/api/projects/projects.queries";
import { useWorkersList } from "../../services/api/workers/workers.queries";
import {
  useAllProjectPositions,
  type ProjectPositionLite,
} from "../../services/api/projects/projectPositions.queries";

import { useAssignWorker } from "../../services/api/assignments/assignments.queries";
import type { AssignmentType } from "../../services/api/assignments/types";

type Props = {
  open: boolean;
  onClose: () => void;
};

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * NewAssignmentModal
 *
 * Creates an assignment using `useAssignWorker()`, which maps UI camelCase → service snake_case
 * and invalidates assignment-related caches on success.
 *
 * Current scope:
 * - PRIMARY assignment only (incumbent)
 * - (We can extend to SECONDARY + TEMP_COVERAGE once this is stable)
 */
export function NewAssignmentModal({ open, onClose }: Props) {
  const [projectId, setProjectId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [rotationSchedule, setRotationSchedule] = useState("14/14");

  // Load dropdown data
  const projects = useProjectsList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const workers = useWorkersList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const allPositions = useAllProjectPositions();

  const positions = useMemo(() => {
  const rows = (allPositions.data ?? []) as ProjectPositionLite[];
  return projectId ? rows.filter((p) => p.project_id === projectId) : [];
}, [allPositions.data, projectId]);

  // Filter positions by selected project
  const positionsForProject = useMemo(() => {
    const rows = (allPositions.data ?? []) as ProjectPositionLite[];
    if (!projectId) return [];
    return rows.filter((p) => p.project_id === projectId);
  }, [allPositions.data, projectId]);

  const assignWorker = useAssignWorker();

  // When modal opens, set default start date
  useEffect(() => {
    if (!open) return;
    setStartDate((prev) => prev || todayDateOnly());
  }, [open]);

  // Reset dependent dropdown when project changes
  useEffect(() => {
    setPositionId("");
  }, [projectId]);

  // Optional: clear fields when closing
  useEffect(() => {
    if (open) return;
    setProjectId("");
    setPositionId("");
    setWorkerId("");
    setStartDate("");
    setRotationSchedule("14/14");
    // do not clear errors; react-query will handle as state changes
  }, [open]);

  const projectList = projects.data?.data ?? [];
  const workerList = (workers.data ?? []) as any[];

  const canSubmit =
    Boolean(projectId) &&
    Boolean(positionId) &&
    Boolean(workerId) &&
    Boolean(startDate) &&
    Boolean(rotationSchedule.trim()) &&
    !assignWorker.isPending;

  const errorMessage = useMemo(() => {
    const err = assignWorker.error as any;
    return err?.message ?? null;
  }, [assignWorker.error]);

  async function submit() {
    if (!canSubmit) return;

    const assignmentType: AssignmentType = "PRIMARY";

    await assignWorker.mutateAsync({
      assignmentType,

      workerId,
      projectId,
      positionId,

      assignmentStartDate: startDate,
      rotationSchedule: rotationSchedule.trim(),

      // PRIMARY does not require these
      assignmentEndDate: null,
      overrideReason: undefined,
      opconSupervisorId: null,
      notes: null,
    });

    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Assignment (Primary)</DialogTitle>

      <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <TextField
          select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Select a project…</MenuItem>
          {projectList.map((p: any) => (
            <MenuItem key={p.id} value={p.id}>
              {p.project_name ?? p.name ?? p.id}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Position"
          value={positionId}
          onChange={(e) => setPositionId(e.target.value)}
          fullWidth
          disabled={!projectId}
        >
          <MenuItem value="">
            {projectId ? "Select a position…" : "Select a project first…"}
          </MenuItem>

          {positionsForProject.map((pos: any) => (
            <MenuItem key={pos.id} value={pos.id}>
              {pos.name ?? pos.id}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Worker"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Select a worker…</MenuItem>
          {workerList.map((w: any) => {
            const label =
              `${w.first_name ?? ""} ${w.last_name ?? ""}`.trim() || w.name || w.id;
            return (
              <MenuItem key={w.id} value={w.id}>
                {label}
              </MenuItem>
            );
          })}
        </TextField>

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        <TextField
          label="Rotation Schedule"
          value={rotationSchedule}
          onChange={(e) => setRotationSchedule(e.target.value)}
          fullWidth
          placeholder="e.g., 14/14"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={assignWorker.isPending}>
          Cancel
        </Button>

        <Button onClick={submit} variant="contained" disabled={!canSubmit}>
          {assignWorker.isPending ? "Creating…" : "Create Assignment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}