// src/pages/vendors/NewVendorModal.tsx

// Import Material-UI components for dialog and form elements
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";
// Import React hooks for state, effects, memoization, and refs
import { useEffect, useMemo, useRef, useState } from "react";
// Import VendorStatus type for status field
import type { VendorStatus } from "@/services/api/vendors/types";
// Import custom hook for creating a new vendor
import { useCreateVendor } from "@/services/api/vendors/vendors.queries";

// Define props type for the modal component
type Props = {
  open: boolean;
  onClose: () => void;
};

// Define function to return an empty form object with default values
function emptyForm() {
  return {
    name: "",
    contact: "",
    email: "",
    main_phone: "",
    extension: "",
    cell: "",
    fax: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    website: "",
    status: "active" as VendorStatus,
  };
}

// Export functional component for New Vendor Modal
export function NewVendorModal({ open, onClose }: Props) {
  // Initialize mutation hook for creating vendor
  const create = useCreateVendor();
  // Initialize state for form data using emptyForm
  const [form, setForm] = useState(emptyForm());
  // Create ref for focusing the first input field
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Effect to reset form and focus first field when modal opens
  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  // Memoize submit eligibility based on name field
  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name]);

  // Define async function to submit form data and create vendor
  async function submit() {
    if (!canSubmit) return;

    // Mutate to create vendor with trimmed form values
    await create.mutateAsync({
      ...form,
      name: form.name.trim(),
      contact: form.contact.trim() || null,
      email: form.email.trim() || null,
      main_phone: form.main_phone.trim() || null,
      extension: form.extension.trim() || null,
      cell: form.cell.trim() || null,
      fax: form.fax.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
      website: form.website.trim() || null,
    });

    // Close modal after successful creation
    onClose();
  }

  // Render the dialog modal
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      // Render dialog title
      <DialogTitle>New Vendor</DialogTitle>

      // Render dialog content with form grid
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          // Grid item for Vendor Name field
          <Grid item xs={12} md={6}>
            <TextField
              label="Vendor Name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              inputRef={firstFieldRef}
              fullWidth
              required
            />
          </Grid>

          // Grid item for Contact field
          <Grid item xs={12} md={3}>
            <TextField
              label="Contact"
              value={form.contact}
              onChange={(e) => setForm((s) => ({ ...s, contact: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Email field
          <Grid item xs={12} md={3}>
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Main Phone field
          <Grid item xs={12} md={4}>
            <TextField
              label="Main Phone"
              value={form.main_phone}
              onChange={(e) => setForm((s) => ({ ...s, main_phone: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Extension field
          <Grid item xs={12} md={2}>
            <TextField
              label="Extension"
              value={form.extension}
              onChange={(e) => setForm((s) => ({ ...s, extension: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Cell field
          <Grid item xs={12} md={3}>
            <TextField
              label="Cell"
              value={form.cell}
              onChange={(e) => setForm((s) => ({ ...s, cell: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Fax field
          <Grid item xs={12} md={3}>
            <TextField
              label="Fax"
              value={form.fax}
              onChange={(e) => setForm((s) => ({ ...s, fax: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Address field
          <Grid item xs={12} md={6}>
            <TextField
              label="Address"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for City field
          <Grid item xs={12} md={2}>
            <TextField
              label="City"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for State field
          <Grid item xs={12} md={2}>
            <TextField
              label="State"
              value={form.state}
              onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Zip field
          <Grid item xs={12} md={2}>
            <TextField
              label="Zip"
              value={form.zip}
              onChange={(e) => setForm((s) => ({ ...s, zip: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Website field
          <Grid item xs={12} md={6}>
            <TextField
              label="Website"
              value={form.website}
              onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))}
              fullWidth
            />
          </Grid>

          // Grid item for Status dropdown
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as VendorStatus }))}
              fullWidth
            >
              // Menu item for Active status
              <MenuItem value="active">Active</MenuItem>
              // Menu item for Inactive status
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        // Display error alert if creation fails
        {create.error && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">{(create.error as Error).message}</Alert>
          </Box>
        )}
      </DialogContent>

      // Render dialog actions with buttons
      <DialogActions>
        // Cancel button to close modal
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        // Submit button, disabled if invalid or pending
        <Button onClick={submit} variant="contained" disabled={!canSubmit || create.isPending}>
          {create.isPending ? "Creating..." : "Create Vendor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}