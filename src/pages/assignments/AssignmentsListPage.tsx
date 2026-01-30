// src/pages/assignments/AssignmentsListPage.tsx

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useProjectsList } from "../../services/api/projects/projects.queries";
import { useWorkersList } from "../../services/api/workers/workers.queries";
import {
  useAssignmentsList,
  useCompleteAssignment,
} from "../../services/api/assignments/assignments.queries";

import type { Assignment } from "../../services/api/assignments/types";
import type { Worker } from "../../services/api/workers/types";

import {
  useAllProjectPositions,
  type ProjectPositionLite,
} from "../../services/api/projects/projectPositions.queries";

function toDateOnly(value: string) {
  if (!value) return value;
  return value.includes("T") ? value.slice(0, 10) : value;
}

function workerLabel(w: Worker) {
  const name = `${w.first_name ?? ""} ${w.last_name ?? ""}`.trim();
  return name || w.id;
}

function positionLabel(pos?: ProjectPositionLite) {
  if (!pos) return "";
  const parts = [
    pos.name ?? "",
    pos.shift ? `• ${pos.shift}` : "",
    pos.rotation_schedule ? `• ${pos.rotation_schedule}` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

/**
 * Assignments list + complete workflow.
 * - "Active" = ended_at is null
 * - "All" = includeEnded = true
 */
export default function AssignmentsListPage() {
  const [view, setView] = useState<"active" | "all">("active");

  // Lookup tables (for ID → label)
  const projects = useProjectsList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const workers = useWorkersList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const positions = useAllProjectPositions();

  // Assignments (your service filters by ended_at, not status)
  const assignments = useAssignmentsList(
    useMemo(
      () => ({
        includeEnded: view === "all",
      }),
      [view]
    )
  );

  const loading =
    projects.isLoading || workers.isLoading || positions.isLoading || assignments.isLoading;

  const error =
    (projects.error as Error | null) ||
    (workers.error as Error | null) ||
    (positions.error as Error | null) ||
    (assignments.error as Error | null);

  const projectList = useMemo(() => projects.data?.data ?? [], [projects.data]);
  const workerList = useMemo(() => (workers.data ?? []) as Worker[], [workers.data]);
  const positionList = useMemo(
    () => (positions.data ?? []) as ProjectPositionLite[],
    [positions.data]
  );

  const projectById = useMemo(() => {
    const m = new Map<string, { id: string; project_name?: string | null }>();
    projectList.forEach((p) => m.set(p.id, p));
    return m;
  }, [projectList]);

  const workerById = useMemo(() => {
    const m = new Map<string, Worker>();
    workerList.forEach((w) => m.set(w.id, w));
    return m;
  }, [workerList]);

  const positionById = useMemo(() => {
    const m = new Map<string, ProjectPositionLite>();
    positionList.forEach((p) => m.set(p.id, p));
    return m;
  }, [positionList]);

  // Normalized list: useAssignmentsList returns Assignment[]
  const list = (assignments.data ?? []) as Assignment[];

  // Complete dialog
  const complete = useCompleteAssignment();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Assignment | null>(null);
  const [completeEndDate, setCompleteEndDate] = useState(toDateOnly(new Date().toISOString()));
  const [endStatus, setEndStatus] = useState<"completed" | "cancelled">("completed");

  // Focus mgmt (prevents MUI aria-hidden warnings)
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const lastActiveElRef = useRef<HTMLElement | null>(null);

  function openComplete(a: Assignment) {
    lastActiveElRef.current = document.activeElement as HTMLElement | null;
    lastActiveElRef.current?.blur?.();

    setCompleteTarget(a);
    setCompleteEndDate(toDateOnly(new Date().toISOString()));
    setEndStatus("completed");
    setCompleteOpen(true);
  }

  function closeComplete() {
    setCompleteOpen(false);
    setCompleteTarget(null);

    window.setTimeout(() => {
      lastActiveElRef.current?.focus?.();
    }, 0);
  }

  async function submitComplete() {
    if (!completeTarget) return;
    if (!completeEndDate.trim()) return;

    await complete.mutateAsync({
      assignmentId: completeTarget.id,
      endedAtIso: new Date(completeEndDate).toISOString(),
      endStatus,
    });

    closeComplete();
  }

  useEffect(() => {
    if (!completeOpen) return;
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [completeOpen]);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h5">Assignments</Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            select
            size="small"
            label="View"
            value={view}
            onChange={(e) => setView(e.target.value as "active" | "all")}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>

          <Button component={Link} to="/assignments/new" variant="contained">
            New Assignment
          </Button>
        </Box>
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

      {!loading && !error && (
        <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
          {list.length === 0 ? (
            <Typography variant="body2">No assignments found.</Typography>
          ) : (
            list.map((a) => {
              const w = workerById.get(a.worker_id);
              const p = projectById.get(a.project_id);
              const pos = positionById.get(a.position_id);

              const workerText = w ? workerLabel(w) : a.worker_id;
              const projectText = p?.project_name ?? a.project_id;
              const positionText = pos ? positionLabel(pos) : a.position_id;

              const isActive = a.ended_at == null;

              return (
                <Paper key={a.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {workerText} → {projectText}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Position: {positionText} • Start: {a.assignment_start_date ?? "-"} • End:{" "}
                        {a.assignment_end_date ?? "-"} • Status: {a.status}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {isActive && (
                        <Button variant="outlined" size="small" onClick={() => openComplete(a)}>
                          Complete
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      )}

      <Dialog open={completeOpen} onClose={closeComplete} fullWidth maxWidth="sm">
        <DialogTitle>Complete Assignment</DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            label="End Date"
            type="date"
            value={completeEndDate}
            onChange={(e) => setCompleteEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputRef={firstFieldRef}
            fullWidth
          />

          <TextField
            select
            label="End Status"
            value={endStatus}
            onChange={(e) => setEndStatus(e.target.value as "completed" | "cancelled")}
            fullWidth
          >
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>

          {complete.error && <Alert severity="error">{(complete.error as Error).message}</Alert>}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeComplete} variant="outlined">
            Cancel
          </Button>

          <Button
            onClick={submitComplete}
            variant="contained"
            disabled={complete.isPending || !completeEndDate.trim()}
          >
            {complete.isPending ? "Completing..." : "Complete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}