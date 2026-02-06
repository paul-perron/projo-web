// src/types/vendor.ts

export type VendorStatus = "active" | "inactive";

export interface Vendor {
  id: string;
  name: string;

  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  primary_contact_fax?: string | null;

  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;

  website?: string | null;

  status: VendorStatus;

  notes?: string | null;

  created_by: string;
  created_at: string;
  updated_at: string;
}