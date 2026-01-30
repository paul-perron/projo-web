// src/pages/projects/ProjectsListPage.tsx
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
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProjectsList } from "../../services/api/projects/projects.queries";
import { useProjectStatuses } from "../../services/api/projects/projectStatuses.queries";
import type { ProjectStatusRow } from "../../services/api/projects/projectStatuses.service";

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"active" | "all">("active");

  // Fetch project statuses
  const statuses = useProjectStatuses({ activeOnly: true });
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

  const projects = useProjectsList(params);

  // Loading and error states
  const loading = projects.isLoading || statuses.isLoading;
  const error = (projects.error as Error | null) || (statuses.error as Error | null);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const projectList = projects.data?.data ?? [];

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
        <Typography variant="h5">Projects</Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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

          <Button variant="contained" onClick={() => navigate("/projects/new")}>
            New Project
          </Button>
        </Box>
      </Box>

      {/* Project List */}
      {projectList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No projects found.
        </Typography>
      ) : (
        <List>
          {projectList.map((project) => (
            <ListItemButton
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
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