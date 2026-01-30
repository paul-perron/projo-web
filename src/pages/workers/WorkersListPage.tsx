// src/pages/workers/WorkersListPage.tsx

/**
 * WorkersListPage Component
 * 
 * Purpose:
 * - Displays a comprehensive list of all workers in the system
 * - Provides quick navigation to individual worker detail pages
 * - Shows worker names and current status at a glance
 * 
 * Key Features:
 * - Simple list view with name and status
 * - Click-to-navigate to worker details
 * - Handles both paginated and direct array API responses
 * - Loading and error states
 * - Fallback to ID when name missing
 * 
 * Business Rules:
 * - Shows first 200 workers (pagination sufficient for most orgs)
 * - Workers ordered by database default (typically created_at desc)
 * - All users can view workers list
 * - Status displayed inline (available, assigned, on_leave, etc.)
 * 
 * Display Format:
 * - Primary: Worker name (FirstName LastName)
 * - Secondary: Status badge
 * - Fallback: Worker ID if name missing
 * 
 * User Interactions:
 * - Click worker button → Navigate to detail page
 * 
 * Future Enhancements:
 * - Add "New Worker" button for creation workflow
 * - Search/filter by name, status, supervisor
 * - Pagination controls for >200 workers
 * - Sort options (name, status, hire date)
 * - Grid/card view toggle
 * - Bulk actions (status changes, assignments)
 * - Export to CSV
 * - Status filter dropdown (show only available, assigned, etc.)
 */

import { Alert, Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useMemo } from "react";

// API Hooks
import { useWorkersList } from "../../services/api/workers/workers.queries";

// Types
import type { Worker } from "../../services/api/workers/types";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility: Format worker name for display
 * 
 * @param w - Worker object (requires id, first_name, last_name)
 * @returns Formatted name or ID fallback
 * 
 * Logic:
 * 1. Concatenate first and last name
 * 2. Trim whitespace
 * 3. Fallback to ID if name is empty
 * 
 * Examples:
 * - {first_name: "John", last_name: "Doe"} → "John Doe"
 * - {first_name: "Jane", last_name: null} → "Jane"
 * - {first_name: null, last_name: null} → worker.id
 * 
 * Why Pick<>?
 * - Allows function to work with partial Worker objects
 * - Explicit about required fields
 * - Type-safe without requiring full Worker type
 */
function label(w: Pick<Worker, "id" | "first_name" | "last_name">) {
  const name = `${w.first_name ?? ""} ${w.last_name ?? ""}`.trim();
  return name || w.id;
}

/**
 * Utility: Normalize workers API response
 * 
 * @param data - Unknown API response format
 * @returns Normalized Worker[] array
 * 
 * Why This Function Exists:
 * - API response format varies between endpoints
 * - Some return: {data: Worker[], total: number}
 * - Others return: Worker[]
 * - This function handles both cases safely
 * 
 * Logic Flow:
 * 1. Guard: Return empty array if data is falsy
 * 2. Check: Is data an object with 'data' property?
 *    - Yes: Extract and validate data.data as array
 *    - No: Validate data itself as array
 * 3. Return: Worker[] or empty array
 * 
 * Type Safety:
 * - Uses type guards (typeof, in, Array.isArray)
 * - Type assertions only after validation
 * - Never throws, always returns valid array
 * 
 * Examples:
 * - {data: [{...}]} → [{...}]
 * - [{...}] → [{...}]
 * - null → []
 * - {data: null} → []
 * - "invalid" → []
 */
function normalizeWorkersData(data: unknown): Worker[] {
  // Guard: Handle null/undefined
  if (!data) return [];

  // Check: Is data a paginated response object?
  if (typeof data === "object" && data !== null && "data" in data) {
    const maybe = (data as { data?: unknown }).data;
    return Array.isArray(maybe) ? (maybe as Worker[]) : [];
  }

  // Otherwise: Treat data as direct array
  return Array.isArray(data) ? (data as Worker[]) : [];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkersListPage() {
  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Query Parameters
   * Memoized to prevent unnecessary re-fetches
   * 
   * Configuration:
   * - page: 1 (first page, no pagination UI yet)
   * - pageSize: 200 (sufficient for most organizations)
   * 
   * Why 200?
   * - Balances performance vs completeness
   * - Most orgs have <200 workers
   * - Loads fast enough for good UX
   * - Reduces need for pagination in v1
   * 
   * Future Enhancement:
   * - Add pagination state for >200 workers
   * - Add infinite scroll or "Load More"
   * - Add virtual scrolling for large lists
   */
  const params = useMemo(() => ({ page: 1, pageSize: 200 }), []);

  /**
   * Workers List Query
   * Fetches all workers for display
   * 
   * Returns:
   * - data: May be Worker[] or {data: Worker[], total: number}
   * - isLoading: True during initial fetch
   * - error: Error object if query fails
   * 
   * Auto-refetch Behavior:
   * - Refetches when params change
   * - Refetches on window focus (React Query default)
   * - Cache invalidated by create/update/delete mutations
   * 
   * Response Format Handling:
   * - Format varies by endpoint implementation
   * - normalizeWorkersData() handles both formats
   */
  const workersQuery = useWorkersList(params);

  // ============================================================================
  // RENDER GUARDS
  // ============================================================================

  /**
   * Loading State
   * Shows centered spinner while workers are being fetched
   * 
   * UX: Simple, centered loading indicator
   * Duration: Typically <500ms for 200 records
   */
  if (workersQuery.isLoading) return <CircularProgress />;

  /**
   * Error State
   * Shows error message if query fails
   * 
   * Common Errors:
   * - Network failure (offline, timeout)
   * - API error (500, database down)
   * - Permission denied (403)
   * - Invalid parameters (400)
   * 
   * UX: Red alert with error message
   * Recovery: User can refresh page
   */
  if (workersQuery.error)
    return <Alert severity="error">{(workersQuery.error as Error).message}</Alert>;

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  /**
   * Normalized Workers List
   * Safely extracts Worker[] from API response
   * 
   * Handles both response formats:
   * - Paginated: {data: Worker[], total: number}
   * - Direct: Worker[]
   * 
   * Always returns valid Worker[] (empty array if invalid)
   */
  const list = normalizeWorkersData(workersQuery.data);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Paper sx={{ p: 2 }}>
      {/* ========================================================================
          HEADER SECTION
          ======================================================================== */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Page Title */}
        <Typography variant="h5">Workers</Typography>

        {/* Future: Add "New Worker" button here */}
        {/* <Button variant="contained" component={Link} to="/workers/new">
              New Worker
            </Button> */}
      </Box>

      {/* ========================================================================
          WORKERS LIST
          ======================================================================== */}
      <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
        {/**
         * Worker List Items
         * 
         * Display Strategy:
         * - Each worker rendered as clickable button
         * - Button styled as outlined for clean look
         * - Left-aligned text (justifyContent: flex-start)
         * 
         * Content Format:
         * - Primary: Worker name (via label() utility)
         * - Secondary: Status badge (if status exists)
         * - Separator: Bullet point (•) between name and status
         * 
         * Interaction:
         * - Click → Navigate to worker detail page
         * - Uses React Router Link component for SPA navigation
         * 
         * Key Prop:
         * - Uses worker.id for stable list rendering
         * - Prevents unnecessary re-renders on list changes
         * 
         * Accessibility:
         * - Button is keyboard navigable
         * - Screen readers announce as link
         * - Clear hover/focus states from MUI
         * 
         * Future Enhancements:
         * - Add avatar/icon
         * - Show supervisor name
         * - Show assignment status
         * - Add quick actions menu (edit, deactivate)
         * - Group by status or team
         */}
        {list.map((w) => (
          <Button
            key={w.id}
            component={Link}
            to={`/workers/${w.id}`}
            variant="outlined"
            sx={{ justifyContent: "flex-start" }}
          >
            {/* Worker Name (with fallback to ID) */}
            {label(w)}
            
            {/* Status Badge (conditional) */}
            {w.status ? ` • ${w.status}` : ""}
          </Button>
        ))}

        {/* Empty State (implicit) */}
        {/**
         * Empty State Handling
         * 
         * Current: Implicit empty state (blank list)
         * Future Enhancement: Add explicit empty state message
         * 
         * Suggested Addition:
         * {list.length === 0 && (
         *   <Typography variant="body2" color="text.secondary">
         *     No workers found.
         *   </Typography>
         * )}
         */}
      </Box>
    </Paper>
  );
}