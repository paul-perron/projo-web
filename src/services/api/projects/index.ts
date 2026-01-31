// src/services/api/projects/index.ts

// ✅ Types should come from ONE place (types.ts)
export type * from "./types";

// ✅ Export queries normally (they usually don't collide)
export * from "./projects.queries";
export * from "./projectPositions.queries";
export * from "./projectStatuses.queries";

// ✅ Export services explicitly (match actual exports)
export {
  listProjects,
  getProject,     // <-- exists
  createProject,
  updateProject,
} from "./projects.service";

export {
  listProjectStatuses,
} from "./projectStatuses.service";