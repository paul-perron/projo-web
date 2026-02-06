// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import VendorsListPage from "@/pages/vendors/VendorsListPage";

// TODO: Replace these imports with your real pages if they exist
// import ProjectsListPage from "@/pages/projects/ProjectsListPage";
// import PersonnelListPage from "@/pages/personnel/PersonnelListPage";
// import AssignmentsListPage from "@/pages/assignments/AssignmentsListPage";
// import ProfilePage from "@/pages/profile/ProfilePage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ✅ Add your existing routes here */}
      {/* <Route path="/projects" element={<ProjectsListPage />} /> */}
      {/* <Route path="/personnel" element={<PersonnelListPage />} /> */}
      {/* <Route path="/assignments" element={<AssignmentsListPage />} /> */}
      {/* <Route path="/profile" element={<ProfilePage />} /> */}

      {/* ✅ Vendors */}
      <Route path="/vendors" element={<VendorsListPage />} />

      {/* default */}
      <Route path="/" element={<Navigate to="/assignments" replace />} />
      <Route path="*" element={<Navigate to="/assignments" replace />} />
    </Routes>
  );
}