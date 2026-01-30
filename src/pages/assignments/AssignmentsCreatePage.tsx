// src/pages/assignments/AssignmentsCreatePage.tsx

/**
 * Create a new assignment for a worker.
 *
 * Rules:
 * - Required: project, position, worker, start date
 * - Rotation schedule required by DB (default "14/14")
 * - If worker already has an active assignment:
 *   - must enable override + provide override reason
 *   - submit as SECONDARY (override-required behavior)
 * - OPCON supervisor is auto-resolved (may be null)
 */

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useProjectsList,
  useProjectPositions,
  useProjectOpconSupervisorId,
} from "../../services/api/projects/projects.queries";
import { useWorkersList } from "../../services/api/workers/workers.queries";
import {
  useAssignWorker,
  useWorkerActiveAssignment,
} from "../../services/api/assignments/assignments.queries";

import {
  useAllProjectPositions,
  type ProjectPositionLite,
} from "../../services/api/projects/projectPositions.queries";

import type { Worker } from "../../services/api/workers/types";
import type { Assignment } from "../../services/api/assignments/types";

type PositionLite = {
  id: string;
  name?: string | null;
  shift?: string | null;
  rotation_schedule?: string | null;
  status?: string | null;
};

function toDateOnly(value: string) {
  if (!value) return value;
  return value.includes("T") ? value.slice(0, 10) : value;
}

function formatWorkerLabel(w: Worker) {
  const name = `${w.first_name ?? ""} ${w.last_name ?? ""}`.trim();
  return name || w.id;
}

function activeAssignmentSummary(
  a: Assignment,
  projectById?: Map<string, { project_name?: string | null }>,
  positionById?: Map<
    string,
    { name?: string | null; shift?: string | null; rotation_schedule?: string | null }
  >
) {
  const start = a.assignment_start_date ?? "-";
  const safeProjectMap = projectById ?? new Map();
  const safePositionMap = positionById ?? new Map();

  const projectName = safeProjectMap.get(a.project_id)?.project_name ?? a.project_id;
  const pos = safePositionMap.get(a.position_id);
  const positionName = pos?.name ?? a.position_id;

  const extras = [pos?.shift ? `• ${pos.shift}` : "", pos?.rotation_schedule ? `• ${pos.rotation_schedule}` : ""].filter(
    Boolean
  );

  return `Project: ${projectName} • Position: ${positionName}${extras.length ? ` ${extras.join(" ")}` : ""} • Start: ${start}`;
}

export default function AssignmentsCreatePage() {
  const navigate = useNavigate();
  const assign = useAssignWorker();

  // UI toggles
  const [showUnavailable, setShowUnavailable] = useState(false);

  // Form state
  const [projectId, setProjectId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rotation, setRotation] = useState("14/14");
  const [notes, setNotes] = useState("");
  const [override, setOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Projects
  const projectsParams = useMemo(() => ({ page: 1, pageSize: 50 }), []);
  const projects = useProjectsList(projectsParams);

  // Positions for selected project (enabled only when projectId set)
  const positions = useProjectPositions(projectId, { enabled: Boolean(projectId) });

  // OPCON supervisor resolution
  const opcon = useProjectOpconSupervisorId(projectId, { enabled: Boolean(projectId) });
  const opconSupervisorId = opcon.data ?? null;

  // Workers list
  const workersParams = useMemo(
  () => ({
    ...(showUnavailable ? {} : { status: "available" as const }),
  }),
  [showUnavailable]
);

const workers = useWorkersList(workersParams);

  // Active assignment conflict (hook already enables itself when workerId exists)
  const active = useWorkerActiveAssignment(workerId);

  // Optional lookup maps for nicer conflict message
  const allPositions = useAllProjectPositions();

  const projectList = useMemo(() => projects.data?.data ?? [], [projects.data]);
  const projectById = useMemo(() => {
    const m = new Map<string, { id: string; project_name?: string | null }>();
    projectList.forEach((p) => m.set(p.id, p));
    return m;
  }, [projectList]);

  const allPositionList = useMemo(
    () => (allPositions.data ?? []) as ProjectPositionLite[],
    [allPositions.data]
  );
  const positionById = useMemo(() => {
    const m = new Map<string, ProjectPositionLite>();
    allPositionList.forEach((pos) => m.set(pos.id, pos));
    return m;
  }, [allPositionList]);

  // Derived lists
  const positionsList = useMemo(() => {
    const raw = (positions.data ?? []) as PositionLite[];
    // Only show active positions in the dropdown
    return raw.filter((p) => (p.status ?? "active") === "active");
  }, [positions.data]);

  const selectedPosition = positionsList.find((p) => p.id === positionId);
  const workersList = (workers.data ?? []) as Worker[];

  const hasConflict = Boolean(workerId && active.data);
  const needsOverrideReason = hasConflict && override && !overrideReason.trim();

  // Auto-fill rotation when user picks a position (we clear rotation on change)
  useEffect(() => {
    if (rotation.trim()) return;
    const next = selectedPosition?.rotation_schedule?.trim() || "14/14";
    setRotation(next);
  }, [selectedPosition, rotation]);

  // Changing worker resets override state
  useEffect(() => {
    setOverride(false);
    setOverrideReason("");
    setFormError(null);
  }, [workerId]);

  async function onSubmit() {
    if (!projectId || !positionId || !workerId || !startDate) return;
    if (active.isLoading) return;

    if (hasConflict) {
      if (!override) {
        setFormError(
          "This worker already has an active assignment. Enable override and provide a reason to proceed."
        );
        return;
      }
      if (!overrideReason.trim()) {
        setFormError("Override reason is required when forcing an assignment.");
        return;
      }
    }

    try {
      setFormError(null);

      // Map UI intent to assignment behavior expected by services:
      // - No conflict -> PRIMARY
      // - Conflict + override -> SECONDARY (requires override_reason)
     const assignmentType = hasConflict && override ? "SECONDARY" : "PRIMARY";

await assign.mutateAsync({
  assignmentType,
  projectId,
  positionId,
  workerId,
  opconSupervisorId,
  assignmentStartDate: toDateOnly(startDate),
  assignmentEndDate: endDate ? toDateOnly(endDate) : null,
  rotationSchedule: rotation.trim() ? rotation.trim() : "14/14",
  notes: notes.trim() ? notes.trim() : null,
  ...(hasConflict && override ? { overrideReason: overrideReason.trim() } : {}),
});

      navigate("/assignments");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create assignment.";
      setFormError(msg);
    }
  }

  const loading =
    projects.isLoading ||
    positions.isLoading ||
    workers.isLoading ||
    opcon.isLoading ||
    active.isLoading ||
    assign.isPending;

  const error =
    (projects.error as Error | null) ||
    (positions.error as Error | null) ||
    (workers.error as Error | null) ||
    (opcon.error as Error | null) ||
    (active.error as Error | null) ||
    (assign.error as Error | null);

  return (
    <Paper sx={{ p: 2, maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5">Assign Worker</Typography>

        <Button
          variant="outlined"
          onClick={() => setShowUnavailable((v) => !v)}
          disabled={workers.isLoading}
        >
          {showUnavailable ? "Hide unavailable" : "Show unavailable"}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ mt: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}

      {projectId && !opcon.isLoading && !opcon.error && !opcon.data && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No OPCON account manager found for this project's customer/sub-customer. Assignment will
          be created with OPCON = null.
        </Alert>
      )}

      {workerId && !active.isLoading && !active.error && active.data && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
            Conflict detected: Worker already has an active assignment.
          </Typography>

          <Typography variant="body2">
            {activeAssignmentSummary(active.data, projectById, positionById)}
          </Typography>

          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Enable override and provide a reason if you need to proceed.
          </Typography>
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          mt: 2,
        }}
      >
        <TextField
          select
          label="Project"
          value={projectId}
          onChange={(e) => {
            const nextProjectId = e.target.value;
            setProjectId(nextProjectId);
            setPositionId("");
            setRotation("14/14");
          }}
          fullWidth
        >
          {(projects.data?.data ?? []).map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.project_name ?? p.id}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Position"
          value={positionId}
          onChange={(e) => {
            setPositionId(e.target.value);
            setRotation(""); // triggers auto-fill from selected position
          }}
          fullWidth
          disabled={!projectId}
        >
          {positionsList.map((pos) => (
            <MenuItem key={pos.id} value={pos.id}>
              {pos.name ?? pos.id}
              {pos.shift ? ` • ${pos.shift}` : ""}
              {pos.rotation_schedule ? ` • ${pos.rotation_schedule}` : ""}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label={showUnavailable ? "Worker (all)" : "Worker (available)"}
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          fullWidth
        >
          {workersList.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {formatWorkerLabel(w)}
              {w.status ? ` • ${w.status}` : ""}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Rotation"
          value={rotation}
          onChange={(e) => setRotation(e.target.value)}
          fullWidth
          placeholder="e.g., 14/14"
        />

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="End Date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
      </Box>

      {formError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {formError}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={override}
              onChange={(e) => {
                const next = e.target.checked;
                setOverride(next);
                if (!next) setOverrideReason("");
              }}
              disabled={!hasConflict}
            />
          }
          label="Override: force assign even if worker already has an active assignment"
        />

        {!hasConflict && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Override is only available when a conflict is detected for the selected worker.
          </Typography>
        )}

        {override && (
          <TextField
            sx={{ mt: 1 }}
            label="Override reason"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            fullWidth
            required
            placeholder="e.g., emergency coverage, schedule correction, supervisor approval…"
            error={needsOverrideReason}
            helperText={needsOverrideReason ? "Override reason is required." : " "}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={
            assign.isPending ||
            !projectId ||
            !positionId ||
            !workerId ||
            !startDate ||
            (hasConflict && (!override || !overrideReason.trim())) ||
            active.isLoading
          }
        >
          Assign
        </Button>

        <Button variant="outlined" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Box>
    </Paper>
  );
}