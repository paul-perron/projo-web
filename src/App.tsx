import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
import { RequireAuth } from "@/components/auth/RequireAuth";

import ProjectsListPage from "./pages/projects/ProjectsListPage";
import ProjectsCreatePage from "./pages/projects/ProjectsCreatePage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import WorkerEditPage from "./pages/workers/WorkerEditPage";
import WorkersListPage from "./pages/workers/WorkersListPage";

import AssignmentsListPage from "./pages/assignments/AssignmentsListPage";
import AssignmentsCreatePage from "./pages/assignments/AssignmentsCreatePage";

function App() {
  const location = useLocation();
  const hideNav = location.pathname === "/login";

  // Marks a nav item active if you're on that route or any sub-route
  function isActive(basePath: string) {
    return location.pathname === basePath || location.pathname.startsWith(basePath + "/");
  }

  const navButtonSx = (active: boolean) => ({
    borderRadius: 1,
    ...(active
      ? {
          bgcolor: "rgba(255,255,255,0.16)",
          textDecoration: "underline",
          textUnderlineOffset: "6px",
        }
      : {
          opacity: 0.9,
        }),
  });

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation (hidden on /login) */}
      {!hideNav && (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              PROJO Admin
            </Typography>

            <Button
              color="inherit"
              component={Link}
              to="/projects"
              sx={navButtonSx(isActive("/projects"))}
            >
              Projects
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/personnel"
              sx={navButtonSx(isActive("/personnel"))}
            >
              Personnel
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/assignments"
              sx={navButtonSx(isActive("/assignments"))}
            >
              Assignments
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/profile"
              sx={navButtonSx(isActive("/profile"))}
            >
              Profile
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* Routed Content */}
      <Container sx={{ py: 3, flexGrow: 1 }}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/projects" replace />} />

          {/* Protected: Projects */}
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <ProjectsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/new"
            element={
              <RequireAuth>
                <ProjectsCreatePage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <RequireAuth>
                <ProjectDetailPage />
              </RequireAuth>
            }
          />

          {/* Protected: Assignments */}
          <Route
            path="/assignments"
            element={
              <RequireAuth>
                <AssignmentsListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/assignments/new"
            element={
              <RequireAuth>
                <AssignmentsCreatePage />
              </RequireAuth>
            }
          />

          {/* Protected: Workers */}
          <Route
            path="/workers"
            element={
              <RequireAuth>
                <WorkersListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/workers/:workerId"
            element={
              <RequireAuth>
                <WorkerEditPage />
              </RequireAuth>
            }
          />

          {/* Protected: Placeholders */}
          <Route
            path="/personnel"
            element={
              <RequireAuth>
                <Typography>Personnel (coming soon)</Typography>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Typography>Profile (coming soon)</Typography>
              </RequireAuth>
            }
          />

          <Route path="*" element={<Typography>Not Found</Typography>} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;