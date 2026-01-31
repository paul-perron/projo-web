// src/pages/assignments/AssignmentsListPage.tsx
/**
 * Assignments list + complete workflow.
 *
 * Concepts:
 * - "Active" view: ended_at IS NULL
 * - "All" view: includeEnded = true
 *
 * Filtering:
 * - Optional filters: projectId, workerId, positionId
 * - Filters are applied server-side via listAssignments(params)
 *
 * Create flow:
 * - New Assignment opens `NewAssignmentModal`
 * - Modal uses `useAssignWorker()` which invalidates caches on success
 * - Therefore this page does NOT need to manually refetch after create
 */

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

import { useProjectsList } from "../../services/api/projects/projects.queries";
import { useWorkersList } from "../../services/api/workers/workers.queries";
import {
  useAssignmentsList,
  useCompleteAssignment,
} from "../../services/api/assignments/assignments.queries";
import {
  useAllProjectPositions,
  type ProjectPositionLite,
} from "../../services/api/projects/projectPositions.queries";

import type { Assignment } from "../../services/api/assignments/types";
import type { Worker } from "../../services/api/workers/types";

import { NewAssignmentModal } from "./NewAssignmentModal";

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



export default function AssignmentsListPage() {
  console.log("[AssignmentsListPage] MOUNT/RENDER");

  const [view, setView] = useState<"active" | "all">("active");

  // Filters
  const [projectFilterId, setProjectFilterId] = useState("");
  const [workerFilterId, setWorkerFilterId] = useState("");
  const [positionFilterId, setPositionFilterId] = useState("");

  // Lookup tables (ID → display label)
  const projects = useProjectsList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const workers = useWorkersList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  const positions = useAllProjectPositions();

  // Assignments list
  const assignments = useAssignmentsList(
    useMemo(
      () => ({
        includeEnded: view === "all",
        projectId: projectFilterId || undefined,
        workerId: workerFilterId || undefined,
        positionId: positionFilterId || undefined,
      }),
      [view, projectFilterId, workerFilterId, positionFilterId]
    )
  );

    useEffect(() => {
    console.log("[AssignmentsListPage] view =", view);
    console.log("[AssignmentsListPage] includeEnded =", view === "all");
    console.log("[AssignmentsListPage] params =", {
      includeEnded: view === "all",
      projectId: projectFilterId || undefined,
      workerId: workerFilterId || undefined,
      positionId: positionFilterId || undefined,
    });
    console.log("[AssignmentsListPage] isLoading =", assignments.isLoading);
    console.log("[AssignmentsListPage] error =", assignments.error);
    console.log("[AssignmentsListPage] length =", assignments.data?.length ?? 0);
    console.log("[AssignmentsListPage] first row =", assignments.data?.[0]);
  }, [
    view,
    projectFilterId,
    workerFilterId,
    positionFilterId,
    assignments.isLoading,
    assignments.error,
    assignments.data,
  ]);

 const list = (assignments.data ?? []) as Assignment[];

  // New assignment modal
  const [newOpen, setNewOpen] = useState(false);

  // Complete dialog
  const complete = useCompleteAssignment();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Assignment | null>(null);
  const [completeEndDate, setCompleteEndDate] = useState(toDateOnly(new Date().toISOString()));
  const [endStatus, setEndStatus] = useState<"completed" | "cancelled">("completed");

  // Focus mgmt (prevents MUI aria-hidden warnings)
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const lastActiveElRef = useRef<HTMLElement | null>(null);

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

  function rememberAndBlurActiveElement() {
    lastActiveElRef.current = document.activeElement as HTMLElement | null;
    lastActiveElRef.current?.blur?.();
  }

  function openNewAssignment() {
    rememberAndBlurActiveElement();
    setNewOpen(true);
  }

  function closeNewAssignment() {
    setNewOpen(false);
    window.setTimeout(() => lastActiveElRef.current?.focus?.(), 0);
  }

  function openComplete(a: Assignment) {
    rememberAndBlurActiveElement();
    setCompleteTarget(a);
    setCompleteEndDate(toDateOnly(new Date().toISOString()));
    setEndStatus("completed");
    setCompleteOpen(true);
  }

  function closeComplete() {
    setCompleteOpen(false);
    setCompleteTarget(null);
    window.setTimeout(() => lastActiveElRef.current?.focus?.(), 0);
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
      {/* Top Row: View + New Assignment */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between" }}>
        <TextField
          select
          size="small"
          label="View"
          value={view}
          onChange={(e) => setView(e.target.value as "active" | "all")}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </TextField>

        <Button onClick={openNewAssignment} variant="contained">
          New Assignment
        </Button>
      </Box>

    {/* Filters Row */}
<Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
  <TextField
    select
    size="small"
    label="Project"
    value={projectFilterId}
    onChange={(e) => {
      const next = e.target.value;
      setProjectFilterId(next);
      setPositionFilterId(""); // reset dependent position filter
      console.log("[AssignmentsListPage] projectFilterId =", next);
    }}
    sx={{ minWidth: 220 }}
  >
    <MenuItem value="">All projects</MenuItem>
    {projectList.map((p: any) => (
      <MenuItem key={p.id} value={p.id}>
        {p.project_name ?? p.name ?? p.id}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    select
    size="small"
    label="Worker"
    value={workerFilterId}
    onChange={(e) => {
      const next = e.target.value;
      setWorkerFilterId(next);
      console.log("[AssignmentsListPage] workerFilterId =", next);
    }}
    sx={{ minWidth: 220 }}
  >
    <MenuItem value="">All workers</MenuItem>
    {workerList.map((w: any) => (
      <MenuItem key={w.id} value={w.id}>
        {workerLabel(w)}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    select
    size="small"
    label="Position"
    value={positionFilterId}
    onChange={(e) => {
      const next = e.target.value;
      setPositionFilterId(next);
      console.log("[AssignmentsListPage] positionFilterId =", next);
    }}
    sx={{ minWidth: 240 }}
  >
    <MenuItem value="">All positions</MenuItem>
    {(projectFilterId
      ? positionList.filter((pos) => pos.project_id === projectFilterId)
      : positionList
    ).map((pos) => (
      <MenuItem key={pos.id} value={pos.id}>
        {positionLabel(pos)}
      </MenuItem>
    ))}
  </TextField>

  <Button
    variant="outlined"
    size="small"
    onClick={() => {
      setProjectFilterId("");
      setWorkerFilterId("");
      setPositionFilterId("");
      console.log("[AssignmentsListPage] filters cleared");
    }}
  >
    Reset
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

      {!loading && !error && (
        <>
          {/* Count Display */}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            Showing {list.length} assignment{list.length === 1 ? "" : "s"}
          </Typography>

          <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
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
        </>
      )}

      {/* New assignment modal */}
      <NewAssignmentModal open={newOpen} onClose={closeNewAssignment} />

      {/* Complete assignment dialog */}
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