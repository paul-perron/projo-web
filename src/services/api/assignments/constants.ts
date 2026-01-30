export const ASSIGNMENT_TYPES = ["PRIMARY", "SECONDARY", "TEMP_COVERAGE"] as const;
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

export const ASSIGNMENT_STATUSES = [
  "assigned",
  "active",
  "temporary_leave",
  "completed",
  "cancelled",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

// Convenience helpers
export const isPrimaryType = (t?: string | null) => t === "PRIMARY";
export const isSecondaryType = (t?: string | null) => t === "SECONDARY";
export const isTempCoverageType = (t?: string | null) => t === "TEMP_COVERAGE";