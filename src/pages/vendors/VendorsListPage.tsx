// src/pages/vendors/VendorsListPage.tsx

// Import necessary Material-UI components for UI rendering
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
// Import React hooks for state management and memoization
import { useMemo, useState } from "react";
// Import React Query hook for data fetching and caching
import { useQuery } from "@tanstack/react-query";

// Import custom modal component for creating new vendors
import { NewVendorModal } from "./NewVendorModal";
// Import type definitions for Vendor and VendorStatus
import type { Vendor, VendorStatus } from "@/types/vendor";
// Import Supabase client for database interactions
import { supabase } from "@/services/supabase"; // adjust if your supabase client path differs

// Define asynchronous function to fetch and sort vendors from Supabase
async function listVendors(): Promise<Vendor[]> {
  // Query Supabase for all vendors, sorted by name ascending
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });

  // Throw error if query fails
  if (error) throw error;
  // Return data as Vendor array or empty array if null
  return (data ?? []) as Vendor[];
}

// Define normalization function to clean and lowercase strings for search
function norm(v?: string | null) {
  // Convert to lowercase, trim, and handle null/undefined
  return (v ?? "").toString().toLowerCase().trim();
}

// Export default functional component for Vendors List Page
export default function VendorsListPage() {
  // Initialize state for search query
  const [q, setQ] = useState("");
  // Initialize state for status filter, default to "all"
  const [status, setStatus] = useState<VendorStatus | "all">("all");

  // Initialize state for new vendor modal visibility
  const [newOpen, setNewOpen] = useState(false);

  // Use React Query to fetch vendors with caching
  const vendorsQuery = useQuery({
    queryKey: ["vendors", "list"],
    queryFn: listVendors,
  });

  // Memoize filtered vendors based on query data, search, and status
  const filtered = useMemo(() => {
    // Use vendors data or empty array if loading
    const rows = vendorsQuery.data ?? [];
    // Normalize search query for case-insensitive matching
    const needle = norm(q);

    // Filter rows by status and search criteria
    return rows.filter((v) => {
      // Exclude if status filter is set and doesn't match
      if (status !== "all" && v.status !== status) return false;

      // Include all if no search query
      if (!needle) return true;

      // Combine and normalize searchable fields into a single string
      const haystack = [
        v.name,
        v.primary_contact_name,
        v.primary_contact_email,
        v.primary_contact_phone,
        v.city,
        v.state,
      ]
        .map(norm)
        .join(" ");

      // Check if search query is in the combined string
      return haystack.includes(needle);
    });
  }, [vendorsQuery.data, q, status]); // Recompute on data, query, or status change

  // Render the page content wrapped in a Paper component
  return (
    <Paper sx={{ p: 2, borderRadius: 1 }}>
      // Display header with title, description, and new vendor button
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          // Render page title
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Vendors
          </Typography>
          // Render subtitle description
          <Typography variant="body2" color="text.secondary">
            Manage vendor directory used by Assets and field operations.
          </Typography>
        </Box>

        // Button to open new vendor modal
        <Button variant="contained" onClick={() => setNewOpen(true)}>
          New Vendor
        </Button>
      </Box>

      // Display search and filter controls
      <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        // Search input field
        <TextField
          size="small"
          label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)} // Update search query on change
          placeholder="Name, contact, city…"
          sx={{ minWidth: 260 }}
        />

        // Status filter dropdown
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)} // Update status filter on change
          sx={{ minWidth: 160 }}
        >
          // Option for all statuses
          <MenuItem value="all">All</MenuItem>
          // Option for active status
          <MenuItem value="active">Active</MenuItem>
          // Option for inactive status
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>

        // Button to reset filters
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setQ(""); // Clear search query
            setStatus("all"); // Reset status to all
          }}
        >
          Reset
        </Button>
      </Box>

      // Show loading spinner if query is loading
      {vendorsQuery.isLoading && (
        <Box sx={{ mt: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      // Show error alert if query fails
      {vendorsQuery.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {(vendorsQuery.error as Error).message}
        </Alert>
      )}

      // Render results if not loading and no error
      {!vendorsQuery.isLoading && !vendorsQuery.error && (
        <>
          // Display count of filtered vendors
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            Showing {filtered.length} vendor{filtered.length === 1 ? "" : "s"}
          </Typography>

          // Render table in scrollable box
          <Box sx={{ mt: 1, overflowX: "auto" }}>
            <Table size="small">
              // Table header row
              <TableHead>
                <TableRow>
                  // Header cell for Vendor name
                  <TableCell sx={{ fontWeight: 700 }}>Vendor</TableCell>
                  // Header cell for Primary Contact
                  <TableCell sx={{ fontWeight: 700 }}>Primary Contact</TableCell>
                  // Header cell for Phone
                  <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                  // Header cell for Email
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  // Header cell for Location
                  <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                  // Header cell for Status
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>

              // Table body with rows
              <TableBody>
                // Show no vendors message if filtered list is empty
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2">No vendors found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Map and render each filtered vendor as a table row
                  filtered.map((v) => (
                    <TableRow key={v.id} hover>
                      // Cell for vendor name
                      <TableCell>{v.name}</TableCell>
                      // Cell for primary contact name, default to "-"
                      <TableCell>{v.primary_contact_name ?? "-"}</TableCell>
                      // Cell for phone, default to "-"
                      <TableCell>{v.primary_contact_phone ?? "-"}</TableCell>
                      // Cell for email, default to "-"
                      <TableCell>{v.primary_contact_email ?? "-"}</TableCell>
                      // Cell for location, combining city and state
                      <TableCell>
                        {[v.city, v.state].filter(Boolean).join(", ") || "-"}
                      </TableCell>
                      // Cell for status, capitalized
                      <TableCell sx={{ textTransform: "capitalize" }}>{v.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
      // Render new vendor modal, controlled by state
      <NewVendorModal open={newOpen} onClose={() => setNewOpen(false)} /> // Close modal on onClose
    </Paper>
  );
}