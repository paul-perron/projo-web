// src/pages/assignments/NewAssignmentModal.tsx

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { useProjectsList } from "../../services/api/projects/projects.queries";
import { useWorkersList } from "../../services/api/workers/workers.queries";
import {
  useAllProjectPositions,
  type ProjectPositionLite,
} from "../../services/api/projects/projectPositions.queries";

import {
  useAssignmentsList,
  useAssignWorker,
} from "../../services/api/assignments/assignments.queries";
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
 *
 * Conflict/override UX:
 * - By default, workers with an active PRIMARY assignment are hidden
 * - Toggle "Show workers already assigned" to include them
 * - If a conflicted worker is selected, an override justification is required
 */
export function NewAssignmentModal({ open, onClose }: Props) {
  const [projectId, setProjectId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [rotationSchedule, setRotationSchedule] = useState("14/14");

    // Override dialog (used only when worker already has an active PRIMARY)
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [conflictText, setConflictText] = useState("");
  
  // Conflict handling
  const [showConflicts, setShowConflicts] = useState(false);

  // Load dropdown data
  const projects = useProjectsList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const workers = useWorkersList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const allPositions = useAllProjectPositions();

  // Load active PRIMARY assignments to detect worker conflicts
  const activePrimaries = useAssignmentsList(
    useMemo(() => ({ includeEnded: false, type: "PRIMARY" as AssignmentType }), [])
  );

  const activePrimaryByWorkerId = useMemo(() => {
    const m = new Map<string, any>();
    const rows = (activePrimaries.data ?? []) as any[];
    for (const a of rows) m.set(a.worker_id, a);
    return m;
  }, [activePrimaries.data]);

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
    setShowConflicts(false);
    setOverrideReason("");
    setOverrideOpen(false);
    setPendingPayload(null);
    setConflictText("");
  }, [open]);

  const projectList = projects.data?.data ?? [];
  const workerListRaw = (workers.data ?? []) as any[];

    const projectById = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of projectList) m.set(p.id, p);
    return m;
  }, [projectList]);

  const positionById = useMemo(() => {
    const m = new Map<string, any>();
    const rows = (allPositions.data ?? []) as any[];
    for (const pos of rows) m.set(pos.id, pos);
    return m;
  }, [allPositions.data]);

  function projectLabelById(id?: string | null) {
    if (!id) return "";
    const p = projectById.get(id);
    return p?.project_name ?? p?.name ?? id;
  }

  function positionLabelById(id?: string | null) {
    if (!id) return "";
    const pos = positionById.get(id);
    // Use your existing fields if available
    return pos?.name ?? id;
  }

  const selectedConflict = useMemo(() => {
    if (!workerId) return null;
    return activePrimaryByWorkerId.get(workerId) ?? null;
  }, [workerId, activePrimaryByWorkerId]);

  const requiresOverride = Boolean(selectedConflict);

  // Default: hide conflicted workers unless toggle is enabled
  const workerList = useMemo(() => {
    if (showConflicts) return workerListRaw;
    return workerListRaw.filter((w) => !activePrimaryByWorkerId.has(w.id));
  }, [workerListRaw, showConflicts, activePrimaryByWorkerId]);

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

    const basePayload = {
      workerId,
      projectId,
      positionId,
      assignmentStartDate: startDate,
      rotationSchedule: rotationSchedule.trim(),

      // not used in our UI yet
      assignmentEndDate: null,
      opconSupervisorId: null,
      notes: null,
    };

    // If worker already has an active PRIMARY, prompt override
    if (selectedConflict) {
      setPendingPayload(basePayload);

            const w = workerListRaw.find((x) => x.id === workerId);
      const workerName =
        w ? `${w.first_name ?? ""} ${w.last_name ?? ""}`.trim() || w.name || w.id : workerId;

      const conflictProject = projectLabelById(selectedConflict.project_id);
      const conflictPosition = positionLabelById(selectedConflict.position_id);

      setConflictText(
        `${workerName} already has an active PRIMARY assignment on ${conflictProject} (${conflictPosition}).`
      );

      setOverrideReason("");
      setOverrideOpen(true);
      return;
    }

    // No conflict → create PRIMARY
    await assignWorker.mutateAsync({
      assignmentType: "PRIMARY" as AssignmentType,
      ...basePayload,
    });

    onClose();
  }

  async function confirmOverride() {
    if (!pendingPayload) return;
    if (!overrideReason.trim()) return;

    await assignWorker.mutateAsync({
      assignmentType: "SECONDARY" as AssignmentType,
      ...pendingPayload,
      overrideReason: overrideReason.trim(),
    });

    setOverrideOpen(false);
    setPendingPayload(null);
    setOverrideReason("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
  {requiresOverride ? "New Assignment (Override Required)" : "New Assignment (Primary)"}
</DialogTitle>

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

        <FormControlLabel
          control={
            <Switch
              checked={showConflicts}
              onChange={(e) => setShowConflicts(e.target.checked)}
            />
          }
          label="Show workers already assigned (requires override)"
        />

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

            const conflict = activePrimaryByWorkerId.get(w.id);
            const suffix = conflict ? " (already assigned)" : "";

            return (
              <MenuItem
                key={w.id}
                value={w.id}
                sx={conflict ? { color: "warning.main", fontWeight: 600 } : undefined}
                >
                {label}
                {suffix}
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

      {/* Override dialog */}
      <Dialog
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Override Required</DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <Alert severity="warning">{conflictText}</Alert>

          <TextField
            label="Override justification"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder="Why are you assigning this worker again?"
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOverrideOpen(false);
              setPendingPayload(null);
              setOverrideReason("");
            }}
            variant="outlined"
          >
            Cancel
          </Button>

          <Button
            onClick={confirmOverride}
            variant="contained"
            disabled={!overrideReason.trim() || assignWorker.isPending}
          >
            Confirm Override
          </Button>
        </DialogActions>
      </Dialog>

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