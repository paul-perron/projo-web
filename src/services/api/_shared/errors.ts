// src/services/api/_shared/errors.ts
import type { PostgrestError } from "@supabase/supabase-js";

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "DB_ERROR"
  | "UNKNOWN";

/**
 * Canonical service-layer error.
 * All feature modules should throw AppError (not raw Supabase errors).
 */
export class AppError extends Error {
  code: AppErrorCode;
  details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function mapPostgrestError(error: PostgrestError): AppError {
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";

  if (code === "42501" || msg.includes("permission denied")) {
    return new AppError(
      "FORBIDDEN",
      "You don’t have permission to perform this action.",
      error
    );
  }

  if (code === "23505") {
    return new AppError("CONFLICT", "This record already exists.", error);
  }

  if (code === "23502") {
    // Not-null violation
    return new AppError(
      "VALIDATION_ERROR",
      `A required field is missing: ${error.details ?? error.message}`,
      error
    );
  }

  if (msg.includes("jwt") || msg.includes("not authenticated")) {
    return new AppError("UNAUTHORIZED", "Please sign in again.", error);
  }

  return new AppError("DB_ERROR", error.message || "Database error", error);
}

/**
 * Helper to assert a Supabase result is OK or throw AppError.
 */
export function assertOk<T>(result: {
  data: T | null;
  error: PostgrestError | null;
}): T {
  if (result.error) throw mapPostgrestError(result.error);
  if (result.data === null) throw new AppError("UNKNOWN", "No data returned.");
  return result.data;
}