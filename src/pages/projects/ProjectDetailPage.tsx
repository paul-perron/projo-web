// src/pages/projects/ProjectDetailPage.tsx

/**
 * Project detail + positions management.
 *
 * Includes:
 * - Project summary (name, customer)
 * - Edit project: Status, End Date, Notes
 * - Positions table with add/edit/deactivate (soft delete)
 *
 * Notes:
 * - Status values come from api.project_statuses (via api client).
 * - Dialog focus management avoids aria-hidden warnings.
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
import { useParams } from "react-router-dom";

// API Hooks
import {
  useProject,
  useProjectPositions,
  useUpdateProject,
} from "../../services/api/projects/projects.queries";
import { useProjectStatuses } from "../../services/api/projects/projectStatuses.queries";

// Components
import PositionsTable, {
  type PositionPatch,
  type ProjectPosition,
} from "../../components/projects/PositionsTable";

// Custom Hooks (positions)
import { useManageProjectPositions } from "../../hooks/projects/useProjectMutations";

// --------------------
// small helpers
// --------------------

function norm(val: unknown) {
  return String(val ?? "").trim();
}

function toDateOnly(value?: string | null) {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}

/**
 * UI-friendly status shape:
 * We normalize DB rows (label/code) into a guaranteed `name` for rendering and lookups.
 */
type ProjectStatusLite = {
  id: string;
  name: string;
  sort_order: number | null;
  is_active: boolean | null;
  is_closed: boolean | null;
};

export default function ProjectDetailPage() {
  /**
   * Route param:
   * - Prefer :projectId, but support legacy :id
   */
  const params = useParams<{ projectId?: string; id?: string }>();
  const projectId = (params.projectId ?? params.id ?? "").trim();
  const enabled = Boolean(projectId);

  // Data
  const project = useProject(projectId, { enabled });
  const positions = useProjectPositions(projectId, { enabled });

  // Mutations
  const manage = useManageProjectPositions(projectId);
  const updateProject = useUpdateProject();

  // Status lookup (active list is enough for UI)
  const statuses = useProjectStatuses({ activeOnly: true, enabled });

  /**
   * IMPORTANT:
   * `useProjectStatuses` is returning DB rows (likely { id, label, code, ... }).
   * This page expects `name`, so we normalize once here.
   */
  const statusList = useMemo((): ProjectStatusLite[] => {
    const rows = (statuses.data ?? []) as Array<{
      id: string;
      label?: string | null;
      code?: string | null;
      sort_order?: number | null;
      is_active?: boolean | null;
      is_closed?: boolean | null;
      // (sometimes people also have name; harmless)
      name?: string | null;
    }>;

    return rows
      .map((r) => {
        const name = (r.name ?? r.label ?? r.code ?? "").trim();
        return {
          id: r.id,
          name,
          sort_order: r.sort_order ?? null,
          is_active: r.is_active ?? null,
          is_closed: r.is_closed ?? null,
        };
      })
      .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  }, [statuses.data]);

  const statusNameById = useMemo(() => {
    const m = new Map<string, string>();
    statusList.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [statusList]);

  const activeStatusId = useMemo(() => {
    return statusList.find((s) => s.name.toLowerCase() === "active")?.id ?? null;
  }, [statusList]);

  const closedStatusId = useMemo(() => {
    return statusList.find((s) => s.name.toLowerCase() === "closed")?.id ?? null;
  }, [statusList]);

  // --------------------
  // project editable fields (local state)
  // --------------------
  const [statusId, setStatusId] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Initialize edit fields once project loads (or when Active status resolves)
  useEffect(() => {
    if (!project.data) return;

    setStatusId(project.data.status_id ?? activeStatusId ?? "");
    setEndDate(toDateOnly(project.data.end_date));
    setNotes(project.data.notes ?? "");
  }, [project.data?.id, activeStatusId]);

  const effectiveStatusId = statusId || project.data?.status_id || activeStatusId || "";
  const statusName = effectiveStatusId ? statusNameById.get(effectiveStatusId) : undefined;

  const isClosed =
    Boolean(closedStatusId && effectiveStatusId === closedStatusId) ||
    statusName?.toLowerCase() === "closed";

  const hasEnded = Boolean(endDate.trim());
  const shouldWarn = isClosed || hasEnded;

  async function saveProjectMeta() {
    if (!projectId) return;

    await updateProject.mutateAsync({
      projectId,
      patch: {
        status_id: effectiveStatusId || null,
        end_date: endDate.trim() ? endDate.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      },
    });

    // Optional: if your query invalidation already refetches, you can remove this
    project.refetch();
  }

  // --------------------
  // focus management for dialogs
  // --------------------
  const lastActiveElRef = useRef<HTMLElement | null>(null);

  function rememberAndBlurActiveElement() {
    lastActiveElRef.current = document.activeElement as HTMLElement | null;
    lastActiveElRef.current?.blur?.();
  }

  // --------------------
  // add/edit dialogs state
  // --------------------
  const [editOpen, setEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editShift, setEditShift] = useState<"day" | "night" | "">("");
  const [editRotation, setEditRotation] = useState("14/14");
  const [editError, setEditError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addShift, setAddShift] = useState<"day" | "night" | "">("");
  const [addRotation, setAddRotation] = useState("14/14");
  const [addError, setAddError] = useState<string | null>(null);

  const positionsList = useMemo(
    () => (positions.data ?? []) as ProjectPosition[],
    [positions.data]
  );

  function openEdit(positionId: string, patch: PositionPatch) {
    rememberAndBlurActiveElement();

    setEditTargetId(positionId);
    setEditName(norm(patch.name));
    setEditShift((norm(patch.shift) as any) || "");
    setEditRotation(norm(patch.rotation_schedule) || "14/14");
    setEditError(null);
    setEditOpen(true);
  }

  function closeEdit() {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setEditOpen(false);
    setEditTargetId(null);
    setEditError(null);
  }

  async function submitEdit() {
    if (!projectId || !editTargetId) return;

    const name = editName.trim();
    if (!name) return;

    try {
      setEditError(null);

      await manage.mutateAsync({
        type: "UPDATE",
        positionId: editTargetId,
        patch: {
          name,
          shift: editShift || null,
          rotation_schedule: editRotation.trim() || null,
        },
      });

      closeEdit();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update position.");
    }
  }

  function openAdd() {
    rememberAndBlurActiveElement();

    setAddName("");
    setAddShift("");
    setAddRotation("14/14");
    setAddError(null);
    setAddOpen(true);
  }

  function closeAdd() {
    (document.activeElement as HTMLElement | null)?.blur?.();
    setAddOpen(false);
    setAddError(null);
  }

  async function submitAdd() {
    if (!projectId) return;

    const name = addName.trim();
    if (!name) return;

    try {
      setAddError(null);

      await manage.mutateAsync({
        type: "ADD",
        position: {
          code: name,
          shift: addShift || undefined,
          rotation: addRotation.trim() || undefined,
        },
      });

      closeAdd();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add position.");
    }
  }

  // --------------------
  // render guards
  // --------------------
  if (!projectId) return <Alert severity="warning">Missing project id.</Alert>;

  if (project.isLoading || statuses.isLoading) return <CircularProgress />;

  const topError = (project.error as Error | null) || (statuses.error as Error | null);
  if (topError) return <Alert severity="error">{topError.message}</Alert>;

  if (!project.data) return <Alert severity="warning">Project not found.</Alert>;

  const saving = updateProject.isPending;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {/* Project summary + editable fields */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h5">{project.data.project_name}</Typography>
            <Typography variant="body2">Customer: {project.data.customer_id}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="contained" onClick={saveProjectMeta} disabled={saving}>
              {saving ? "Saving..." : "Save Project"}
            </Button>
          </Box>
        </Box>

        {shouldWarn && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {isClosed
              ? "Project is Closed (treat as historical)."
              : "Project has an End Date (treat as ended)."}
          </Alert>
        )}

        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          <TextField
            select
            label="Status"
            value={effectiveStatusId}
            onChange={(e) => setStatusId(e.target.value)}
            disabled={!statusList.length || saving}
            helperText="Lifecycle intent (Planned / Active / Paused / Closed)"
            fullWidth
          >
            {statusList.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={saving}
            helperText="Factual end of work (optional)"
            fullWidth
          />

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
            fullWidth
            multiline
            minRows={3}
            sx={{ gridColumn: { xs: "1 / -1" } }}
          />
        </Box>

        {updateProject.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(updateProject.error as Error).message}
          </Alert>
        )}
      </Paper>

      {/* Positions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Positions
        </Typography>

        {positions.isLoading && <CircularProgress size={20} />}

        {positions.error && <Alert severity="error">{(positions.error as Error).message}</Alert>}

        {positions.data && (
          <PositionsTable
            rows={positionsList}
            isBusy={manage.isPending}
            onAdd={openAdd}
            onDeactivate={(positionId) => manage.mutate({ type: "DEACTIVATE", positionId })}
            onUpdate={(positionId, patch) => openEdit(positionId, patch)}
          />
        )}
      </Paper>

      {/* Add Position */}
      <Dialog
        open={addOpen}
        onClose={closeAdd}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
        TransitionProps={{
          onExited: () => lastActiveElRef.current?.focus?.(),
        }}
      >
        <DialogTitle>Add Position</DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            autoFocus
            label="Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            fullWidth
            placeholder="e.g., D3, N2, Welder, Forklift…"
          />

          <TextField
            select
            label="Shift"
            value={addShift}
            onChange={(e) => setAddShift(e.target.value as any)}
            fullWidth
          >
            <MenuItem value="">—</MenuItem>
            <MenuItem value="day">day</MenuItem>
            <MenuItem value="night">night</MenuItem>
          </TextField>

          <TextField
            label="Rotation Schedule"
            value={addRotation}
            onChange={(e) => setAddRotation(e.target.value)}
            fullWidth
            placeholder="e.g., 14/14"
          />

          {addError && <Alert severity="error">{addError}</Alert>}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeAdd} variant="outlined">
            Cancel
          </Button>

          <Button
            onClick={submitAdd}
            variant="contained"
            disabled={manage.isPending || !addName.trim()}
          >
            {manage.isPending ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Position */}
      <Dialog
        open={editOpen}
        onClose={closeEdit}
        fullWidth
        maxWidth="sm"
        disableRestoreFocus
        TransitionProps={{
          onExited: () => lastActiveElRef.current?.focus?.(),
        }}
      >
        <DialogTitle>Edit Position</DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            autoFocus
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Shift"
            value={editShift}
            onChange={(e) => setEditShift(e.target.value as any)}
            fullWidth
          >
            <MenuItem value="">—</MenuItem>
            <MenuItem value="day">day</MenuItem>
            <MenuItem value="night">night</MenuItem>
          </TextField>

          <TextField
            label="Rotation Schedule"
            value={editRotation}
            onChange={(e) => setEditRotation(e.target.value)}
            fullWidth
            placeholder="e.g., 14/14"
          />

          {editError && <Alert severity="error">{editError}</Alert>}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEdit} variant="outlined">
            Cancel
          </Button>

          <Button
            onClick={submitEdit}
            variant="contained"
            disabled={manage.isPending || !editName.trim()}
          >
            {manage.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}