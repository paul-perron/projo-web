// src/services/projects/types.ts
import type { ISODateString } from "../_shared/types";

export interface Project {
  id: string;
  customer_id: string;
  sub_customer_id?: string | null;
  project_name: string;
  start_date: ISODateString;
  end_date?: ISODateString | null;

  positions_required: number;
  default_rotation: string;
  status_id: string;

  notes?: string | null;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CreateProjectInput = Omit<Project, "id" | "created_at" | "updated_at">;
export type UpdateProjectInput = Partial<Omit<Project, "id" | "created_at" | "updated_at">>;