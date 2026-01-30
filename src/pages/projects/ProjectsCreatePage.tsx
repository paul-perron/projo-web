// src/pages/projects/ProjectsCreatePage.tsx
/**
 * Create a new project.
 *
 * Rules:
 * - Project name + customer are required.
 * - Status is selected from public.project_statuses (no UUID copy/paste).
 * - If user doesn’t choose a status, we auto-select “Active” (if present).
 * - If “Active” doesn’t exist, status stays null and the service will throw a helpful error.
 */

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { useCreateProject } from "../../services/api/projects/projects.queries";
import { useProjectStatuses } from "../../services/api/projects/projectStatuses.queries";
import type { ProjectCreate } from "../../services/api/projects/projects.service";

type ProjectStatusLite = {
  id: string;
  name: string;
  sort_order: number | null;
  is_active: boolean | null;
};

export default function ProjectsCreatePage() {
  const navigate = useNavigate();

  const create = useCreateProject();
  // Hook expects an options object
  const statuses = useProjectStatuses({ activeOnly: true });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectCreate>({
    defaultValues: {
      project_name: "",
      customer_id: "",
      sub_customer_id: null,
      status_id: null,
      wbs_code: null,
      default_rotation: "14/14",
      positions_required: 4,
      start_date: null,
      end_date: null,
      special_requirements: null,
      safety_requirements: null,
      notes: null,
    },
  });

  const statusId = watch("status_id");

  const statusList = useMemo(
    () => (statuses.data ?? []) as ProjectStatusLite[],
    [statuses.data]
  );

  // Auto-select "Active" (only if user hasn't picked something)
  useEffect(() => {
    if (statusId) return;
    if (!statusList.length) return;

    const active = statusList.find(
      (s: ProjectStatusLite) => s.name.toLowerCase() === "active"
    );

    if (active) {
      setValue("status_id", active.id, { shouldValidate: true });
    }
  }, [statusId, statusList, setValue]);

  const onSubmit = handleSubmit(async (values: ProjectCreate) => {
    const cleaned: ProjectCreate = {
      project_name: values.project_name?.trim(),
      customer_id: values.customer_id?.trim(),
      sub_customer_id: values.sub_customer_id || null,

      status_id: values.status_id || null,

      wbs_code: values.wbs_code || null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      default_rotation: values.default_rotation || null,
      positions_required: values.positions_required ?? null,
      special_requirements: values.special_requirements || null,
      safety_requirements: values.safety_requirements || null,
      notes: values.notes || null,
    };

    const saved = await create.mutateAsync(cleaned);
    navigate(`/projects/${saved.id}`);
  });

  const loading = create.isPending || statuses.isLoading;
  const error = (create.error as Error | null) || (statuses.error as Error | null);

  return (
    <Paper sx={{ p: 2, maxWidth: 760 }}>
      <Typography variant="h5" gutterBottom>
        New Project
      </Typography>

      {loading && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
        {/* Required */}
        <TextField
          label="Project Name"
          {...register("project_name", { required: "Project name is required" })}
          error={!!errors.project_name}
          helperText={errors.project_name?.message}
        />

        <TextField
          label="Customer ID (UUID)"
          {...register("customer_id", { required: "Customer id is required" })}
          error={!!errors.customer_id}
          helperText={errors.customer_id?.message}
        />

        {/* Optional */}
        <TextField
          select
          label="Status"
          value={statusId ?? ""}
          onChange={(e) =>
            setValue("status_id", e.target.value || null, { shouldValidate: true })
          }
          disabled={statuses.isLoading || !statusList.length}
          helperText={
            statuses.isLoading
              ? "Loading statuses..."
              : "Controls lifecycle (Active, Planned, Paused, Closed, etc.)"
          }
        >
          {statusList.map((s: ProjectStatusLite) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField label="WBS Code" {...register("wbs_code")} />

        <TextField
          label="Default Rotation"
          {...register("default_rotation")}
          placeholder="14/14"
        />

        <TextField
          label="Positions Required"
          type="number"
          {...register("positions_required", { valueAsNumber: true })}
          helperText="Auto-created positions for this project"
        />

        <TextField
          label="Start Date"
          {...register("start_date")}
          type="date"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="End Date"
          {...register("end_date")}
          type="date"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Notes"
          multiline
          minRows={3}
          {...register("notes")}
          placeholder="Anything helpful for the team..."
        />

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" type="submit" disabled={loading}>
            {create.isPending ? "Creating..." : "Create Project"}
          </Button>

          <Button variant="outlined" onClick={() => navigate("/projects")} disabled={loading}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}