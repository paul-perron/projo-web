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

// Import Material-UI components for UI elements
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
// Import React hooks for state, effects, memoization, and refs
import { useEffect, useMemo, useRef, useState } from "react";

// Import custom query hook for fetching projects list
import { useProjectsList } from "../../services/api/projects/projects.queries";
// Import custom query hook for fetching workers list
import { useWorkersList } from "../../services/api/workers/workers.queries";
// Import custom hooks for assignments list and completing assignments
import {
  useAssignmentsList,
  useCompleteAssignment,
} from "../../services/api/assignments/assignments.queries";
// Import custom query hook for fetching all project positions
import {
  useAllProjectPositions,
  type ProjectPositionLite,
} from "../../services/api/projects/projectPositions.queries";

// Import type for Assignment
import type { Assignment } from "../../services/api/assignments/types";
// Import type for Worker
import type { Worker } from "../../services/api/workers/types";

// Import modal component for new assignments
import { NewAssignmentModal } from "./NewAssignmentModal";

// Utility function to convert ISO date to YYYY-MM-DD
function toDateOnly(value: string) {
  if (!value) return value;
  return value.includes("T") ? value.slice(0, 10) : value;
}

// Utility function to generate worker display label
function workerLabel(w: Worker) {
  const name = `${w.first_name ?? ""} ${w.last_name ?? ""}`.trim();
  return name || w.id;
}

// Utility function to generate position display label
function positionLabel(pos?: ProjectPositionLite) {
  if (!pos) return "";
  const parts = [
    pos.name ?? "",
    pos.shift ? `• ${pos.shift}` : "",
    pos.rotation_schedule ? `• ${pos.rotation_schedule}` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

// Utility function to get chip info for assignment type
function assignmentTypeChip(type?: string) {
  switch (type) {
    case "PRIMARY":
      return { label: "PRIMARY", color: "success" as const };
    case "SECONDARY":
      return { label: "SECONDARY", color: "warning" as const };
    case "TEMP_COVERAGE":
      return { label: "TEMP", color: "info" as const };
    default:
      return { label: type ?? "UNKNOWN", color: "default" as const };
  }
}

// Utility function to get styles for assignment status
function statusStyle(status: string | null | undefined) {
  switch (status) {
    case "active":
      return {
        text: "success.main",
        rail: "success.light",
      };
    case "completed":
      return {
        text: "text.secondary",
        rail: "grey.300",
      };
    case "cancelled":
      return {
        text: "error.main",
        rail: "error.light",
      };
    default:
      return {
        text: "text.secondary",
        rail: "transparent",
      };
  }
}

// Utility function to get styles for assignment type
function typeStyle(type?: string) {
  switch (type) {
    case "PRIMARY":
      return { color: "success.main", dot: "success.main", label: "Primary" };
    case "SECONDARY":
      return { color: "warning.main", dot: "warning.main", label: "Secondary" };
    case "TEMP_COVERAGE":
      return { color: "info.main", dot: "info.main", label: "Temp" };
    default:
      return { color: "text.primary", dot: "grey.500", label: type ?? "Unknown" };
  }
}

// Utility function to normalize strings for search
function norm(s?: string | null) {
  return (s ?? "").toString().toLowerCase().trim();
}

// Main component for Assignments List Page
export default function AssignmentsListPage() {
  console.log("[AssignmentsListPage] MOUNT/RENDER");

  // State for view filter (active or all)
  const [view, setView] = useState<"active" | "all">("active");
  // State for dense layout toggle
  const [dense, setDense] = useState(false);
  // State for sort field
  const [sortBy, setSortBy] = useState<"start_date" | "worker" | "project" | "position" | "type">("start_date");
  // State for sort direction
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filters
  // State for project filter ID
  const [projectFilterId, setProjectFilterId] = useState("");
  // State for worker filter ID
  const [workerFilterId, setWorkerFilterId] = useState("");
  // State for position filter ID
  const [positionFilterId, setPositionFilterId] = useState("");
  // State for search query
  const [q, setQ] = useState("");

  // Lookup tables (ID → display label)
  // Fetch projects with memoized params
  const projects = useProjectsList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  // Fetch workers with memoized params
  const workers = useWorkersList(useMemo(() => ({ page: 1, pageSize: 500 }), []));
  // Fetch all positions
  const positions = useAllProjectPositions();

  // Assignments list
  // Fetch assignments with memoized params
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

  // Effect for debugging state changes
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

  // Prepare assignments list
  const list = (assignments.data ?? []) as Assignment[];

  // New assignment modal
  // State for new assignment modal visibility
  const [newOpen, setNewOpen] = useState(false);

  // Complete dialog
  // Mutation hook for completing assignments
  const complete = useCompleteAssignment();
  // State for complete dialog visibility
  const [completeOpen, setCompleteOpen] = useState(false);
  // State for target assignment to complete
  const [completeTarget, setCompleteTarget] = useState<Assignment | null>(null);
  // State for end date in complete dialog
  const [completeEndDate, setCompleteEndDate] = useState(toDateOnly(new Date().toISOString()));
  // State for end status in complete dialog
  const [endStatus, setEndStatus] = useState<"completed" | "cancelled">("completed");

  // Focus mgmt (prevents MUI aria-hidden warnings)
  // Ref for first field in complete dialog
  const firstFieldRef = useRef<HTMLInputElement>(null);
  // Ref for last active element before opening dialogs
  const lastActiveElRef = useRef<HTMLElement | null>(null);

  // Combined loading state from all queries
  const loading =
    projects.isLoading || workers.isLoading || positions.isLoading || assignments.isLoading;

  // Combined error state from all queries
  const error =
    (projects.error as Error | null) ||
    (workers.error as Error | null) ||
    (positions.error as Error | null) ||
    (assignments.error as Error | null);

  // Memoize project list
  const projectList = useMemo(() => projects.data?.data ?? [], [projects.data]);
  // Memoize worker list
  const workerList = useMemo(() => (workers.data ?? []) as Worker[], [workers.data]);
  // Memoize position list
  const positionList = useMemo(
    () => (positions.data ?? []) as ProjectPositionLite[],
    [positions.data]
  );

  // Memoize project map by ID
  const projectById = useMemo(() => {
    const m = new Map<string, { id: string; project_name?: string | null }>();
    projectList.forEach((p) => m.set(p.id, p));
    return m;
  }, [projectList]);

  // Memoize worker map by ID
  const workerById = useMemo(() => {
    const m = new Map<string, Worker>();
    workerList.forEach((w) => m.set(w.id, w));
    return m;
  }, [workerList]);

  // Memoize position map by ID
  const positionById = useMemo(() => {
    const m = new Map<string, ProjectPositionLite>();
    positionList.forEach((p) => m.set(p.id, p));
    return m;
  }, [positionList]);

  // Memoize filtered list based on search query
  const filteredList = useMemo(() => {
    const needle = norm(q);
    if (!needle) return list;

    return list.filter((a) => {
      const w = workerById.get(a.worker_id);
      const p = projectById.get(a.project_id);
      const pos = positionById.get(a.position_id);
    
      const haystack = [
        workerLabel(w as any),
        p?.project_name ?? "",
        pos?.name ?? "",
        a.assignment_type ?? "",
        a.status ?? "",
      ]
        .map(norm)
        .join(" ");

      return haystack.includes(needle);
    });
  }, [q, list, workerById, projectById, positionById]);

  // Memoize sorted list based on sort criteria
  const sortedList = useMemo(() => {
      const dir = sortDir === "asc" ? 1 : -1;

      function cmp(a: string, b: string) {
        return a.localeCompare(b) * dir;
      }

      function safe(v: string | null | undefined) {
        return (v ?? "").toString();
      }

      return [...filteredList].sort((a, b) => {
        if (sortBy === "start_date") {
          const av = safe(a.assignment_start_date);
          const bv = safe(b.assignment_start_date);
          return cmp(av, bv);
        }

        if (sortBy === "type") {
          return cmp(safe(a.assignment_type), safe(b.assignment_type));
        }

        if (sortBy === "worker") {
          const aw = workerById.get(a.worker_id);
          const bw = workerById.get(b.worker_id);
          return cmp(workerLabel(aw as any), workerLabel(bw as any));
        }

        if (sortBy === "project") {
          const ap = projectById.get(a.project_id);
          const bp = projectById.get(b.project_id);
          return cmp(safe(ap?.project_name), safe(bp?.project_name));
        }

        if (sortBy === "position") {
          const apos = positionById.get(a.position_id);
          const bpos = positionById.get(b.position_id);
          return cmp(safe(apos?.name), safe(bpos?.name));
        }

        return 0;
      });
   }, [filteredList, sortBy, sortDir, workerById, projectById, positionById]);

  // Function to remember and blur active element before opening dialogs
  function rememberAndBlurActiveElement() {
    lastActiveElRef.current = document.activeElement as HTMLElement | null;
    lastActiveElRef.current?.blur?.();
  }

  // Function to open new assignment modal
  function openNewAssignment() {
    rememberAndBlurActiveElement();
    setNewOpen(true);
  }

  // Function to close new assignment modal
  function closeNewAssignment() {
    setNewOpen(false);
    window.setTimeout(() => lastActiveElRef.current?.focus?.(), 0);
  }

  // Function to open complete dialog for an assignment
  function openComplete(a: Assignment) {
    rememberAndBlurActiveElement();
    setCompleteTarget(a);
    setCompleteEndDate(toDateOnly(new Date().toISOString()));
    setEndStatus("completed");
    setCompleteOpen(true);
  }

  // Function to close complete dialog
  function closeComplete() {
    setCompleteOpen(false);
    setCompleteTarget(null);
    window.setTimeout(() => lastActiveElRef.current?.focus?.(), 0);
  }

  // Async function to submit complete assignment
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

  // Effect to focus first field when complete dialog opens
  useEffect(() => {
    if (!completeOpen) return;
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [completeOpen]);

  // Main container
  return (
    <Paper sx={{ p: 2, borderRadius: 1 }}>
      {/* Top Row: View + New Assignment */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between" }}>
        // View filter and dense toggle
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          // Dropdown for view selection
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

          // Switch for compact layout
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={dense}
                onChange={(e) => setDense(e.target.checked)}
              />
            }
            label="Compact"
          />
        </Box>

        // Button to open new assignment modal
        <Button onClick={openNewAssignment} variant="contained">
          New Assignment
        </Button>
      </Box>

      {/* Filters Row */}
      <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>

      // Search input field
      <TextField
        size="small"
        label="Search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ minWidth: 240 }}
        placeholder="Worker, project, position…"
      />

        // Dropdown for project filter
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

        // Dropdown for worker filter
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
          sx={{ minWidth: 240 }}
          disabled={!projectFilterId && positionList.length > 0 ? false : false} // keep enabled unless YOU want project-first
        >
          <MenuItem value="">All workers</MenuItem>
          {workerList.map((w: any) => (
            <MenuItem key={w.id} value={w.id}>
              {workerLabel(w)}
            </MenuItem>
          ))}
        </TextField>

        // Dropdown for position filter
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

        // Dropdown for sort field
        <TextField
          select
          size="small"
          label="Sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="start_date">Start Date</MenuItem>
          <MenuItem value="worker">Worker</MenuItem>
          <MenuItem value="project">Project</MenuItem>
          <MenuItem value="position">Position</MenuItem>
          <MenuItem value="type">Type</MenuItem>
        </TextField>

        // Dropdown for sort direction
        <TextField
          select
          size="small"
          label="Dir"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as any)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="desc">Desc</MenuItem>
          <MenuItem value="asc">Asc</MenuItem>
        </TextField>

                // Button to reset all filters
                <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setProjectFilterId("");
            setWorkerFilterId("");
            setPositionFilterId("");
            setQ("");
            setSortBy("start_date");
            setSortDir("desc");
            console.log("[AssignmentsListPage] filters cleared");
          }}
        >
          Reset
        </Button>
      </Box>

      // Display error if any
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}

      // Render results if not loading and no error
      {!loading && !error && (
        <>
          {/* Count Display */}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            Showing {sortedList.length} assignment{sortedList.length === 1 ? "" : "s"}
          </Typography>

          // Grid of assignment cards
          <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
            {sortedList.length === 0 ? (
              // Message if no assignments found
              <Typography variant="body2">No assignments found.</Typography>
            ) : (
              sortedList.map((a) => {
                const w = workerById.get(a.worker_id);
                const p = projectById.get(a.project_id);
                const pos = positionById.get(a.position_id);

                const workerText = w ? workerLabel(w) : a.worker_id;
                const projectText = p?.project_name ?? a.project_id;
                const positionText = pos ? positionLabel(pos) : a.position_id;

                const isActive = a.status === "active" && a.ended_at == null;
                const { text: statusText, rail: statusRail } = statusStyle(a.status);

                const t = typeStyle(a.assignment_type);

                // Build metadata explicitly to avoid duplication
                const metaParts: string[] = [];

               metaParts.push(`Position: ${positionText}`);

                if (pos?.shift) metaParts.push(pos.shift);
                if (pos?.rotation_schedule) metaParts.push(pos.rotation_schedule);

               metaParts.push(`Start: ${toDateOnly(a.assignment_start_date ?? "") || "-"}`);
               metaParts.push(`End: ${toDateOnly(a.assignment_end_date ?? "") || "-"}`);

                const metaText = metaParts.join(" • ");

                // Assignment card
                return (
                  <Paper
                    key={a.id}
                    variant="outlined"
                    sx={{
                      p: dense ? 0.75 : 1.5,
                      borderLeft: "4px solid",
                      borderLeftColor: statusRail,
                      backgroundColor: "transparent",
                    }}
                  >
                    // Card content layout
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      {/* LEFT: text */}
                      <Box>
                        <Typography
                          component="div"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontWeight: 600,
                            fontSize: dense ? "0.875rem" : "1rem",
                          }}
                        >
                          {/* tiny dot indicator */}
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: t.dot,
                              flex: "0 0 auto",
                            }}
                          />

                          <Box component="span">{workerText} → </Box>

                          {/* project name is colored by type */}
                          <Box component="span" sx={{ color: t.color }}>
                            {projectText}
                          </Box>

                          {/* optional tiny type label (subtle) */}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            ({t.label})
                          </Typography>
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.25,
                            fontSize: dense ? "0.75rem" : undefined,
                          }}
                        >
                          {metaText}
                          {" • "}Status:{" "}
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 600,
                              color: statusText,
                              textTransform: "capitalize",
                            }}
                          >
                            {a.status}
                          </Typography>
                        </Typography>
                      </Box>

                      {/* RIGHT: action button */}
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        {isActive && (
                          // Button to open complete dialog for active assignments
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
        // Dialog title
        <DialogTitle>Complete Assignment</DialogTitle>

        // Dialog content with fields
        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          // End date input
          <TextField
            label="End Date"
            type="date"
            value={completeEndDate}
            onChange={(e) => setCompleteEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputRef={firstFieldRef}
            fullWidth
          />

          // Dropdown for end status
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

          // Error alert if mutation fails
          {complete.error && <Alert severity="error">{(complete.error as Error).message}</Alert>}
        </DialogContent>

        // Dialog actions
        <DialogActions>
          // Cancel button
          <Button onClick={closeComplete} variant="outlined">
            Cancel
          </Button>

          // Submit button for completing assignment
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