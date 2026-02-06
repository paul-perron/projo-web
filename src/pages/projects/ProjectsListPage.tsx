// src/pages/projects/ProjectsListPage.tsx

// Import Material-UI components for UI elements
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
// Import React hooks for state management and memoization
import { useMemo, useState } from "react";
// Import React Router hook for navigation
import { useNavigate } from "react-router-dom";

// Import custom query hook for fetching projects list
import { useProjectsList } from "../../services/api/projects/projects.queries";
// Import custom query hook for fetching project statuses
import { useProjectStatuses } from "../../services/api/projects/projectStatuses.queries";
// Import type for project status rows
import type { ProjectStatusRow } from "../../services/api/projects/projectStatuses.service";

// Main component for listing projects
export default function ProjectsListPage() {
  // Hook for programmatic navigation
  const navigate = useNavigate();
  // State for view filter (active or all projects)
  const [view, setView] = useState<"active" | "all">("active");

  // Fetch project statuses
  const statuses = useProjectStatuses({ activeOnly: true });
  // Prepare status list from query data
  const statusList = (statuses.data ?? []) as ProjectStatusRow[];

  // Find the "Active" status ID
  const activeStatusId = useMemo(() => {
    const active = statusList.find((s) => 
      s?.label?.toLowerCase() === "active" || s?.code?.toLowerCase() === "active"
    );
    return active?.id ?? null;
  }, [statusList]);

  // Build a map of status ID -> status label for display
  const statusNameById = useMemo(() => {
    const map = new Map<string, string>();
    statusList.forEach((s) => {
      if (s?.id && s?.label) {
        map.set(s.id, s.label);
      }
    });
    return map;
  }, [statusList]);

  // Projects query parameters
  const params = useMemo(() => {
    return {
      page: 1,
      pageSize: 25,
      ...(view === "active" && activeStatusId ? { statusId: activeStatusId } : {}),
    };
  }, [view, activeStatusId]);

  // Fetch projects based on parameters
  const projects = useProjectsList(params);

  // Loading and error states
  const loading = projects.isLoading || statuses.isLoading;
  const error = (projects.error as Error | null) || (statuses.error as Error | null);

  // Render loading spinner if data is loading
  if (loading) return <CircularProgress />;
  // Render error alert if there's an error
  if (error) return <Alert severity="error">{error.message}</Alert>;

  // Prepare project list from query data
  const projectList = projects.data?.data ?? [];

  // Main container
  return (
    <Paper sx={{ p: 2 }}>
      {/* Header with View filter and New Project button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        // Page title
        <Typography variant="h5">Projects</Typography>

        // Controls for view filter and new project button
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          // Dropdown for selecting view (active or all)
          <TextField
            select
            size="small"
            label="View"
            value={view}
            onChange={(e) => setView(e.target.value as "active" | "all")}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>

          // Button to navigate to new project creation page
          <Button variant="contained" onClick={() => navigate("/projects/new")}>
            New Project
          </Button>
        </Box>
      </Box>

      {/* Project List */}
      {projectList.length === 0 ? (
        // Message if no projects are found
        <Typography variant="body2" color="text.secondary">
          No projects found.
        </Typography>
      ) : (
        // List of projects
        <List>
          {projectList.map((project) => (
            // Clickable list item for each project
            <ListItemButton
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              // Text displaying project name and status
              <ListItemText
                primary={project.project_name}
                secondary={
                  project.status_id
                    ? `Status: ${statusNameById.get(project.status_id) ?? "Unknown"}`
                    : "Status: Not set"
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );
}