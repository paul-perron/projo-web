import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, Navigate, Route, Routes } from "react-router-dom";

import ProjectsListPage from "./pages/projects/ProjectsListPage";
import ProjectsCreatePage from "./pages/projects/ProjectsCreatePage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import WorkerEditPage from './pages/workers/WorkerEditPage';
import WorkersListPage from "./pages/workers/WorkersListPage";


import AssignmentsListPage from "./pages/assignments/AssignmentsListPage";
import AssignmentsCreatePage from "./pages/assignments/AssignmentsCreatePage";

function App() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            PROJO Admin
          </Typography>

          <Button color="inherit" component={Link} to="/projects">
            Projects
          </Button>
          <Button color="inherit" component={Link} to="/personnel">
            Personnel
          </Button>
          <Button color="inherit" component={Link} to="/assignments">
            Assignments
          </Button>
          <Button color="inherit" component={Link} to="/profile">
            Profile
          </Button>
        </Toolbar>
      </AppBar>

      {/* Routed Content */}
      <Container sx={{ py: 3, flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />

          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/new" element={<ProjectsCreatePage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

          <Route path="/assignments" element={<AssignmentsListPage />} />
          <Route path="/assignments/new" element={<AssignmentsCreatePage />} />
          
          <Route path="/workers" element={<WorkersListPage />} />
          <Route path="/workers/:workerId" element={<WorkerEditPage />} />

          {/* Placeholder routes */}
          <Route
            path="/personnel"
            element={<Typography>Personnel (coming soon)</Typography>}
          />
          <Route
            path="/profile"
            element={<Typography>Profile (coming soon)</Typography>}
          />

          <Route path="*" element={<Typography>Not Found</Typography>} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;