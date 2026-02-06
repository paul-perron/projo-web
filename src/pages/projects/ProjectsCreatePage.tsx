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

// Import React hooks for side effects and memoization
import { useEffect, useMemo } from "react";
// Import React Router hook for programmatic navigation
import { useNavigate } from "react-router-dom";
// Import React Hook Form for form management and validation
import { useForm } from "react-hook-form";

// Import Material-UI components for layout, form fields, and feedback
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

// Import custom mutation hook for creating a project
import { useCreateProject } from "../../services/api/projects/projects.queries";
// Import custom query hook for fetching available project statuses
import { useProjectStatuses } from "../../services/api/projects/projectStatuses.queries";
// Import TypeScript type for project creation payload
import type { ProjectCreate } from "../../services/api/projects/projects.service";

// Lightweight type for status dropdown items (used only in this component)
type ProjectStatusLite = {
  id: string;
  name: string;
  sort_order: number | null;
  is_active: boolean | null;
};

// Main component for creating a new project
export default function ProjectsCreatePage() {
  // Hook for redirecting after successful creation
  const navigate = useNavigate();

  // Mutation hook for creating the project
  const create = useCreateProject();
  // Hook expects an options object
  const statuses = useProjectStatuses({ activeOnly: true });

  // React Hook Form setup with default values and validation
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

  // Watch the current status_id value for auto-select logic
  const statusId = watch("status_id");

  // Memoize the status list (cast from query data)
  const statusList = useMemo(() => {
    const rows = statuses.data ?? [];
    return rows as unknown as ProjectStatusLite[];
  }, [statuses.data]);

  // Auto-select "Active" (only if user hasn't picked something)
  useEffect(() => {
    if (statusId) return;
    if (!statusList.length) return;

    // Find status whose name is "Active" (case-insensitive)
    const active = statusList.find(
      (s) => (s.name ?? "").toLowerCase().trim() === "active"
    );

    if (active?.id) {
      setValue("status_id", active.id, { shouldValidate: true });
    }
  }, [statusId, statusList, setValue]);

  // Form submission handler with data cleaning and navigation
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

  // Combined loading state from mutation and statuses query
  const loading = create.isPending || statuses.isLoading;
  // Combined error state from mutation or statuses query
  const error = (create.error as Error | null) || (statuses.error as Error | null);

  // Main container
  return (
    <Paper sx={{ p: 2, maxWidth: 760 }}>
      {/* Page title */}
      <Typography variant="h5" gutterBottom>
        New Project
      </Typography>

      {/* Show loading spinner while creating or fetching statuses */}
      {loading && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {/* Show any error from create or statuses query */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Form wrapper */}
      <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2 }}>
        {/* Required fields */}
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

        {/* Optional fields */}
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

        {/* Action buttons */}
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