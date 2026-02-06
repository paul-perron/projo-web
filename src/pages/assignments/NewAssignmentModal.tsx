// src/pages/assignments/NewAssignmentModal.tsx

// Import Material-UI components for dialog and form elements
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
// Import React hooks for state, effects, and memoization
import { useEffect, useMemo, useState } from "react";

// Import custom query hook for fetching projects list
import { useProjectsList } from "../../services/api/projects/projects.queries";
// Import custom query hook for fetching workers list
import { useWorkersList } from "../../services/api/workers/workers.queries";
// Import custom query hook for fetching all project positions
import {
  useAllProjectPositions,
  type ProjectPositionLite,
} from "../../services/api/projects/projectPositions.queries";

// Import custom hooks for assignments list and assigning workers
import {
  useAssignmentsList,
  useAssignWorker,
} from "../../services/api/assignments/assignments.queries";
// Import type for AssignmentType
import type { AssignmentType } from "../../services/api/assignments/types";

// Define props type for the modal component
type Props = {
  open: boolean;
  onClose: () => void;
};

// Utility function to get today's date in YYYY-MM-DD format
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
// Export functional component for New Assignment Modal
export function NewAssignmentModal({ open, onClose }: Props) {
  // State for selected project ID
  const [projectId, setProjectId] = useState("");
  // State for selected position ID
  const [positionId, setPositionId] = useState("");
  // State for selected worker ID
  const [workerId, setWorkerId] = useState("");
  // State for start date
  const [startDate, setStartDate] = useState("");
  // State for rotation schedule, default to "14/14"
  const [rotationSchedule, setRotationSchedule] = useState("14/14");

    // Override dialog (used only when worker already has an active PRIMARY)
  // State for override dialog visibility
  const [overrideOpen, setOverrideOpen] = useState(false);
  // State for override reason text
  const [overrideReason, setOverrideReason] = useState("");
  // State for pending assignment payload during override
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  // State for conflict description text
  const [conflictText, setConflictText] = useState("");
  
  // Conflict handling
  // State for showing conflicted workers toggle
  const [showConflicts, setShowConflicts] = useState(false);

  // Load dropdown data
  // Fetch projects with memoized params
  const projects = useProjectsList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  // Fetch workers with memoized params
  const workers = useWorkersList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  // Fetch all positions
  const allPositions = useAllProjectPositions();

  // Load active PRIMARY assignments to detect worker conflicts
  // Fetch active primary assignments with memoized params
  const activePrimaries = useAssignmentsList(
    useMemo(() => ({ includeEnded: false, type: "PRIMARY" as AssignmentType }), [])
  );

  // Memoize map of active primary assignments by worker ID
  const activePrimaryByWorkerId = useMemo(() => {
    const m = new Map<string, any>();
    const rows = (activePrimaries.data ?? []) as any[];
    for (const a of rows) m.set(a.worker_id, a);
    return m;
  }, [activePrimaries.data]);

  // Filter positions by selected project
  // Memoize positions for the selected project
  const positionsForProject = useMemo(() => {
    const rows = (allPositions.data ?? []) as ProjectPositionLite[];
    if (!projectId) return [];
    return rows.filter((p) => p.project_id === projectId);
  }, [allPositions.data, projectId]);

  // Mutation hook for assigning worker
  const assignWorker = useAssignWorker();

  // When modal opens, set default start date
  // Effect to set default start date when modal opens
  useEffect(() => {
    if (!open) return;
    setStartDate((prev) => prev || todayDateOnly());
  }, [open]);

  // Reset dependent dropdown when project changes
  // Effect to reset position ID when project changes
  useEffect(() => {
    setPositionId("");
  }, [projectId]);

  // Optional: clear fields when closing
  // Effect to reset all fields when modal closes
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

  // Prepare project list
  const projectList = projects.data?.data ?? [];
  // Prepare raw worker list
  const workerListRaw = (workers.data ?? []) as any[];

    // Memoize project map by ID
    const projectById = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of projectList) m.set(p.id, p);
    return m;
  }, [projectList]);

  // Memoize position map by ID
  const positionById = useMemo(() => {
    const m = new Map<string, any>();
    const rows = (allPositions.data ?? []) as any[];
    for (const pos of rows) m.set(pos.id, pos);
    return m;
  }, [allPositions.data]);

  // Utility function to get project label by ID
  function projectLabelById(id?: string | null) {
    if (!id) return "";
    const p = projectById.get(id);
    return p?.project_name ?? p?.name ?? id;
  }

  // Utility function to get position label by ID
  function positionLabelById(id?: string | null) {
    if (!id) return "";
    const pos = positionById.get(id);
    // Use your existing fields if available
    return pos?.name ?? id;
  }

  // Memoize selected worker's conflict if any
  const selectedConflict = useMemo(() => {
    if (!workerId) return null;
    return activePrimaryByWorkerId.get(workerId) ?? null;
  }, [workerId, activePrimaryByWorkerId]);

  // Check if override is required for selected worker
  const requiresOverride = Boolean(selectedConflict);

  // Default: hide conflicted workers unless toggle is enabled
  // Memoize filtered worker list based on showConflicts
  const workerList = useMemo(() => {
    if (showConflicts) return workerListRaw;
    return workerListRaw.filter((w) => !activePrimaryByWorkerId.has(w.id));
  }, [workerListRaw, showConflicts, activePrimaryByWorkerId]);

   // Check if form can be submitted
   const canSubmit =
    Boolean(projectId) &&
    Boolean(positionId) &&
    Boolean(workerId) &&
    Boolean(startDate) &&
    Boolean(rotationSchedule.trim()) &&
    !assignWorker.isPending;

  // Memoize error message from mutation
  const errorMessage = useMemo(() => {
    const err = assignWorker.error as any;
    return err?.message ?? null;
  }, [assignWorker.error]);

    // Async function to submit assignment
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

  // Async function to confirm and submit override
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

  // Render the main dialog
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
  {requiresOverride ? "New Assignment (Override Required)" : "New Assignment (Primary)"}
</DialogTitle>

      // Dialog content with form fields
      <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
        // Display error if any
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        // Dropdown for project selection
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

        // Dropdown for position selection
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

        // Toggle to show conflicted workers
        <FormControlLabel
          control={
            <Switch
              checked={showConflicts}
              onChange={(e) => setShowConflicts(e.target.checked)}
            />
          }
          label="Show workers already assigned (requires override)"
        />

        // Dropdown for worker selection
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

        // Input for start date
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        // Input for rotation schedule
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
        // Override dialog title
        <DialogTitle>Override Required</DialogTitle>

        // Override dialog content
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          // Warning alert with conflict details
          <Alert severity="warning">{conflictText}</Alert>

          // Textarea for override justification
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

        // Override dialog actions
        <DialogActions>
          // Cancel button for override
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

          // Confirm button for override
          <Button
            onClick={confirmOverride}
            variant="contained"
            disabled={!overrideReason.trim() || assignWorker.isPending}
          >
            Confirm Override
          </Button>
        </DialogActions>
      </Dialog>

      // Main dialog actions
      <DialogActions>
        // Cancel button
        <Button onClick={onClose} variant="outlined" disabled={assignWorker.isPending}>
          Cancel
        </Button>

        // Submit button
        <Button onClick={submit} variant="contained" disabled={!canSubmit}>
          {assignWorker.isPending ? "Creating…" : "Create Assignment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}