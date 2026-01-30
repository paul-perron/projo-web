// src/pages/workers/WorkerEditPage.tsx

/**
 * WorkerEditPage Component
 * 
 * Purpose:
 * - Provides interface for editing worker attributes
 * - Currently focused on ADCON supervisor assignment
 * - Loads worker details and available supervisors
 * 
 * Key Features:
 * - Edit ADCON (Administrative Control) supervisor assignment
 * - Dropdown populated with all workers except current worker
 * - Shows supervisor name and email for easy identification
 * - Validates and saves changes via API
 * - Navigation back to worker detail on success/cancel
 * 
 * Business Rules:
 * - Each worker must have exactly 1 ADCON supervisor
 * - Worker cannot be their own supervisor (filtered from list)
 * - ADCON supervisor can be null (unassigned)
 * - Empty string converted to null before submission
 * - Changes logged via audit trail (handled by API)
 * 
 * Form State Management:
 * - Uses controlled component pattern
 * - Initializes from loaded worker data
 * - Lazy initialization prevents reset on re-render
 * - Local state preserved until save/cancel
 * 
 * Data Flow:
 * 1. Load worker by ID from route params
 * 2. Load all workers for supervisor dropdown
 * 3. Initialize form with current ADCON supervisor
 * 4. User selects new supervisor
 * 5. Submit update mutation
 * 6. Navigate back to worker detail
 * 
 * Future Enhancements:
 * - Add more editable fields (contact info, status, etc.)
 * - Add validation rules
 * - Add unsaved changes warning
 * - Add field-level error messages
 */

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
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// API Hooks
import { 
  useWorker, 
  useWorkersList, 
  useUpdateWorker 
} from "../../services/api/workers/workers.queries";

// Types
import type { Worker } from "../../services/api/workers/types";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkerEditPage() {
  // ============================================================================
  // ROUTE PARAMETERS & NAVIGATION
  // ============================================================================

  /**
   * Extract worker ID from URL route
   * 
   * Route: /workers/:workerId/edit
   * Example: /workers/abc-123/edit → workerId = "abc-123"
   */
  const { workerId } = useParams<{ workerId: string }>();

  /**
   * Navigation Hook
   * Used to navigate back to worker detail page after save/cancel
   */
  const navigate = useNavigate();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Worker Query
   * Fetches details of the worker being edited
   * 
   * Used to:
   * - Display worker name in header
   * - Initialize ADCON supervisor field
   * - Determine edit permissions (future)
   */
  const workerQuery = useWorker(workerId ?? "");

  /**
   * Workers List Query
   * Fetches all workers to populate supervisor dropdown
   * 
   * Pagination: 200 items (sufficient for supervisor selection)
   * 
   * Used to:
   * - Populate ADCON supervisor dropdown
   * - Filter out current worker (can't supervise self)
   * - Display supervisor names and emails
   */
  const workersQuery = useWorkersList({ page: 1, pageSize: 200 });

  /**
   * Update Worker Mutation
   * Handles API call to save changes
   * 
   * On Success:
   * - Worker record updated
   * - Queries invalidated and refetched
   * - Navigate to worker detail page
   * 
   * On Error:
   * - Error displayed in form
   * - User remains on edit page
   */
  const updateWorker = useUpdateWorker();

  // ============================================================================
  // FORM STATE MANAGEMENT
  // ============================================================================

  /**
   * ADCON Supervisor Local State
   * 
   * Why Local State?
   * - Preserves user input while editing
   * - Prevents form reset on query refetch
   * - Only updates database on explicit save
   * 
   * Initial Value Strategy:
   * - Starts as empty string (not yet initialized)
   * - Lazy initialization via useMemo + guard
   * - Once set by user, preserves value
   * 
   * Empty String Semantics:
   * - "" = not yet initialized (use server value)
   * - Once initialized, empty string would mean "clear supervisor"
   */
  const [adconSupervisorId, setAdconSupervisorId] = useState<string>("");

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  /**
   * Type-safe Worker Extraction
   * Provides typed access to worker data
   */
  const worker = workerQuery.data as Worker | undefined;

  /**
   * Lazy Initialization of ADCON Supervisor
   * 
   * Strategy: One-time initialization without useEffect
   * 
   * How It Works:
   * - Memoizes initial value from loaded worker
   * - Only computes when worker.adcon_supervisor_worker_id changes
   * - Doesn't overwrite user's local edits
   * 
   * Why Not useEffect?
   * - Avoids dependency complexity
   * - Simpler reasoning about state
   * - No timing issues with async updates
   * 
   * Returns: Current server value or empty string
   */
  const initialAdcon = useMemo(() => {
    const current = worker?.adcon_supervisor_worker_id ?? "";
    return current;
  }, [worker?.adcon_supervisor_worker_id]);

  /**
   * Active ADCON Value
   * 
   * Logic:
   * - If user has made changes (adconSupervisorId !== ""), use local state
   * - Otherwise, use initial value from server
   * 
   * This pattern:
   * - Respects user input
   * - Initializes from server data
   * - Doesn't reset on re-render
   */
  const adconValue = adconSupervisorId !== "" ? adconSupervisorId : initialAdcon;

  /**
   * Available Supervisors List
   * 
   * Filter Logic:
   * - Exclude current worker (can't supervise self)
   * - Include all other workers
   * 
   * Normalization:
   * - Handles both paginated ({data: []}) and direct ([]) response formats
   * - Type assertion ensures Worker[] type safety
   * 
   * Memoized to prevent filter re-execution on every render
   */
  const availableSupervisors = useMemo(() => {
    const list = (workersQuery.data?.data ?? workersQuery.data ?? []) as Worker[];
    return list.filter((w) => w.id !== workerId);
  }, [workersQuery.data, workerId]);

  // ============================================================================
  // UI STATE INDICATORS
  // ============================================================================

  /**
   * Aggregate Loading State
   * True if either worker or workers list is loading
   * 
   * Both must load before form can be displayed:
   * - Worker: Needed for name and current supervisor
   * - Workers list: Needed for supervisor dropdown
   */
  const loading = workerQuery.isLoading || workersQuery.isLoading;

  /**
   * Aggregate Error State
   * Returns first error encountered or null
   * 
   * Possible errors:
   * - Worker not found
   * - Workers list query failed
   * - Update mutation failed
   */
  const error =
    (workerQuery.error as Error | null) ||
    (workersQuery.error as Error | null) ||
    (updateWorker.error as Error | null);

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  /**
   * Handle Save Action
   * 
   * Validation:
   * - Worker ID must exist (from route params)
   * 
   * Data Normalization:
   * - Trim whitespace from supervisor ID
   * - Convert empty string to null (database expectation)
   * 
   * Process:
   * 1. Validate worker ID exists
   * 2. Normalize supervisor ID value
   * 3. Call update mutation
   * 4. Wait for success
   * 5. Navigate back to worker detail
   * 
   * Error Handling:
   * - Errors displayed via updateWorker.error in UI
   * - User remains on page to retry
   */
  async function onSave() {
    if (!workerId) return;

    await updateWorker.mutateAsync({
      workerId,
      updates: {
        adcon_supervisor_worker_id: adconValue.trim() ? adconValue.trim() : null,
      },
    });

    // Navigate back to worker detail on success
    navigate(`/workers/${workerId}`);
  }

  // ============================================================================
  // RENDER GUARDS
  // ============================================================================

  /**
   * Loading State
   * Shows centered spinner while data loads
   * 
   * Both queries must complete before form displays
   */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  /**
   * Error or Not Found State
   * Shows error message if:
   * - Worker doesn't exist
   * - Query failed
   * - Update mutation failed
   */
  if (!worker || error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">
          {error ? error.message : "Worker not found"}
        </Alert>
      </Paper>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Paper sx={{ p: 2, maxWidth: 600 }}>
      {/* ========================================================================
          PAGE HEADER
          ======================================================================== */}
      <Typography variant="h5" gutterBottom>
        Edit Worker: {worker.first_name} {worker.last_name}
      </Typography>

      {/* ========================================================================
          EDIT FORM
          ======================================================================== */}
      <Box sx={{ display: "grid", gap: 2, mt: 3 }}>
        
        {/* ADCON Supervisor Selection */}
        <TextField
          select
          label="ADCON Supervisor"
          value={adconValue}
          onChange={(e) => setAdconSupervisorId(e.target.value)}
          helperText="Select the worker's administrative supervisor"
          fullWidth
        >
          {/* None/Unassigned Option */}
          <MenuItem value="">
            <em>None</em>
          </MenuItem>

          {/* Available Supervisors */}
          {/**
           * Supervisor Dropdown Options
           * 
           * Display Format:
           * - Primary: First name + Last name
           * - Secondary: Email (if available)
           * 
           * Business Logic:
           * - Current worker excluded from list
           * - Shows all other workers
           * 
           * Future Enhancement:
           * - Filter by role/permission
           * - Show current assignment count
           * - Group by department/team
           */}
          {availableSupervisors.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.first_name} {w.last_name}
              {w.iss_email ? ` (${w.iss_email})` : ""}
            </MenuItem>
          ))}
        </TextField>

        {/* Mutation Error Display */}
        {updateWorker.error && (
          <Alert severity="error">{(updateWorker.error as Error).message}</Alert>
        )}

        {/* ======================================================================
            FORM ACTIONS
            ====================================================================== */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {/* Save Button */}
          <Button 
            variant="contained" 
            onClick={onSave} 
            disabled={updateWorker.isPending}
          >
            {updateWorker.isPending ? "Saving..." : "Save"}
          </Button>

          {/* Cancel Button */}
          <Button 
            variant="outlined" 
            onClick={() => navigate(`/workers/${workerId}`)}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}