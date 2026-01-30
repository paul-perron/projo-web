export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  api: {
    Tables: {
      assignments: {
        Row: {
          assignment_end_date: string | null
          assignment_start_date: string
          assignment_type: string | null
          charge_rate_override: number | null
          created_at: string
          created_by: string
          ended_at: string | null
          id: string
          notes: string | null
          opcon_supervisor_id: string | null
          org_id: string | null
          override_reason: string | null
          pay_rate_override: number | null
          position_id: string
          project_id: string
          rotation_schedule: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          assignment_end_date?: string | null
          assignment_start_date: string
          assignment_type?: string | null
          charge_rate_override?: number | null
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          opcon_supervisor_id?: string | null
          org_id?: string | null
          override_reason?: string | null
          pay_rate_override?: number | null
          position_id: string
          project_id: string
          rotation_schedule: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          assignment_end_date?: string | null
          assignment_start_date?: string
          assignment_type?: string | null
          charge_rate_override?: number | null
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          opcon_supervisor_id?: string | null
          org_id?: string | null
          override_reason?: string | null
          pay_rate_override?: number | null
          position_id?: string
          project_id?: string
          rotation_schedule?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_opcon_supervisor_id_fkey"
            columns: ["opcon_supervisor_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          field_changed: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          note: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          note?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          note?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          account_manager_worker_id: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contract_owner: string | null
          created_at: string
          id: string
          international_contact: string | null
          name: string
          notes: string | null
          state: string | null
          status: string
          supervisor_contact: string | null
          updated_at: string
          work_area: string | null
          zip: string | null
        }
        Insert: {
          account_manager_worker_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contract_owner?: string | null
          created_at?: string
          id?: string
          international_contact?: string | null
          name: string
          notes?: string | null
          state?: string | null
          status?: string
          supervisor_contact?: string | null
          updated_at?: string
          work_area?: string | null
          zip?: string | null
        }
        Update: {
          account_manager_worker_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contract_owner?: string | null
          created_at?: string
          id?: string
          international_contact?: string | null
          name?: string
          notes?: string | null
          state?: string | null
          status?: string
          supervisor_contact?: string | null
          updated_at?: string
          work_area?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_account_manager_fk"
            columns: ["account_manager_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_account_manager_worker_fk"
            columns: ["account_manager_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      project_positions: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          project_id: string
          rotation_schedule: string | null
          shift: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          project_id: string
          rotation_schedule?: string | null
          shift: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
          rotation_schedule?: string | null
          shift?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_positions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_statuses: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          default_rotation: string | null
          end_date: string | null
          id: string
          notes: string | null
          positions_required: number
          project_name: string
          safety_requirements: string | null
          special_requirements: string | null
          start_date: string | null
          status_id: string | null
          sub_customer_id: string | null
          updated_at: string
          wbs_code: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          default_rotation?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          positions_required?: number
          project_name: string
          safety_requirements?: string | null
          special_requirements?: string | null
          start_date?: string | null
          status_id?: string | null
          sub_customer_id?: string | null
          updated_at?: string
          wbs_code?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          default_rotation?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          positions_required?: number
          project_name?: string
          safety_requirements?: string | null
          special_requirements?: string | null
          start_date?: string | null
          status_id?: string | null
          sub_customer_id?: string | null
          updated_at?: string
          wbs_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sub_customer_id_fkey"
            columns: ["sub_customer_id"]
            isOneToOne: false
            referencedRelation: "sub_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_customers: {
        Row: {
          account_manager_worker_id: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          customer_id: string
          id: string
          name: string
          notes: string | null
          state: string | null
          status: string
          updated_at: string
          work_area: string | null
          zip: string | null
        }
        Insert: {
          account_manager_worker_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          customer_id: string
          id?: string
          name: string
          notes?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          work_area?: string | null
          zip?: string | null
        }
        Update: {
          account_manager_worker_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          name?: string
          notes?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          work_area?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_customers_account_manager_fk"
            columns: ["account_manager_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          previous_status: string
          reason: string | null
          worker_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          previous_status: string
          reason?: string | null
          worker_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string
          reason?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_status_history_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          adcon_supervisor_id: string | null
          adcon_supervisor_worker_id: string | null
          address_line1: string | null
          address_line2: string | null
          auth_user_id: string | null
          city: string | null
          created_at: string
          default_charge_rate: number | null
          default_pay_rate: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          hire_date: string
          id: string
          iss_email: string
          last_name: string
          last_rate_adjusted: string | null
          notes: string | null
          personal_email: string | null
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          worker_type: string
          zip: string | null
        }
        Insert: {
          adcon_supervisor_id?: string | null
          adcon_supervisor_worker_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          auth_user_id?: string | null
          city?: string | null
          created_at?: string
          default_charge_rate?: number | null
          default_pay_rate?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          hire_date: string
          id?: string
          iss_email: string
          last_name: string
          last_rate_adjusted?: string | null
          notes?: string | null
          personal_email?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          worker_type: string
          zip?: string | null
        }
        Update: {
          adcon_supervisor_id?: string | null
          adcon_supervisor_worker_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          auth_user_id?: string | null
          city?: string | null
          created_at?: string
          default_charge_rate?: number | null
          default_pay_rate?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          hire_date?: string
          id?: string
          iss_email?: string
          last_name?: string
          last_rate_adjusted?: string | null
          notes?: string | null
          personal_email?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          worker_type?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_adcon_supervisor_fk"
            columns: ["adcon_supervisor_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_adcon_supervisor_id_fkey"
            columns: ["adcon_supervisor_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          p_action: string
          p_changed_by: string
          p_entity_id: string
          p_entity_type: string
          p_field_changed: string
          p_metadata: Json
          p_new_value: string
          p_old_value: string
        }
        Returns: string
      }
      current_org_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_date: string
          assigned_to_id: string
          assigned_to_type: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          returned_date: string | null
        }
        Insert: {
          asset_id: string
          assigned_date?: string
          assigned_to_id: string
          assigned_to_type: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          returned_date?: string | null
        }
        Update: {
          asset_id?: string
          assigned_date?: string
          assigned_to_id?: string
          assigned_to_type?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          returned_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      asset_history: {
        Row: {
          asset_id: string
          changed_at: string
          changed_by: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          asset_id: string
          changed_at?: string
          changed_by: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          asset_id?: string
          changed_at?: string
          changed_by?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_number: string
          billable: boolean | null
          category_id: string
          condition: string
          created_at: string
          created_by: string | null
          current_value: number | null
          date_acquired: string | null
          description: string | null
          id: string
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          owner: string | null
          purchase_order_no: string | null
          retired_date: string | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_number: string
          billable?: boolean | null
          category_id: string
          condition?: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          date_acquired?: string | null
          description?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          owner?: string | null
          purchase_order_no?: string | null
          retired_date?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_number?: string
          billable?: boolean | null
          category_id?: string
          condition?: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          date_acquired?: string | null
          description?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          owner?: string | null
          purchase_order_no?: string | null
          retired_date?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_history: {
        Row: {
          assignment_id: string
          changed_at: string
          changed_by: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          assignment_id: string
          changed_at?: string
          changed_by: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          assignment_id?: string
          changed_at?: string
          changed_by?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      assignment_swaps: {
        Row: {
          created_at: string
          created_by: string
          effective_date: string
          id: string
          new_assignment_id: string | null
          original_assignment_id: string
          reason: string
          reason_notes: string | null
          return_date: string | null
          swap_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          effective_date: string
          id?: string
          new_assignment_id?: string | null
          original_assignment_id: string
          reason: string
          reason_notes?: string | null
          return_date?: string | null
          swap_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          effective_date?: string
          id?: string
          new_assignment_id?: string | null
          original_assignment_id?: string
          reason?: string
          reason_notes?: string | null
          return_date?: string | null
          swap_type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          field_changed: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          note: string | null
          old_value: Json | null
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
        }
        Relationships: []
      }
      certification_requirements: {
        Row: {
          certification_type_id: string
          created_at: string
          customer_id: string | null
          id: string
          project_id: string | null
          requirement_type: string
          sub_customer_id: string | null
        }
        Insert: {
          certification_type_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          project_id?: string | null
          requirement_type: string
          sub_customer_id?: string | null
        }
        Update: {
          certification_type_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          project_id?: string | null
          requirement_type?: string
          sub_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certification_requirements_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_types: {
        Row: {
          alert_days_before_expiration: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_renewal_alert: boolean | null
          typical_validity_days: number | null
          updated_at: string
        }
        Insert: {
          alert_days_before_expiration?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_renewal_alert?: boolean | null
          typical_validity_days?: number | null
          updated_at?: string
        }
        Update: {
          alert_days_before_expiration?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_renewal_alert?: boolean | null
          typical_validity_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      compensation_history: {
        Row: {
          changed_by: string | null
          created_at: string
          effective_date: string
          field_changed: string
          id: string
          new_value: number | null
          old_value: number | null
          reason: string | null
          worker_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          effective_date?: string
          field_changed: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          reason?: string | null
          worker_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          effective_date?: string
          field_changed?: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          reason?: string | null
          worker_id?: string
        }
        Relationships: []
      }
      customer_contacts: {
        Row: {
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string | null
          sub_customer_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          sub_customer_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          sub_customer_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      employee_certifications: {
        Row: {
          certification_type_id: string
          created_at: string
          document_url: string | null
          expiration_date: string
          id: string
          issue_date: string
          notes: string | null
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          certification_type_id: string
          created_at?: string
          document_url?: string | null
          expiration_date: string
          id?: string
          issue_date: string
          notes?: string | null
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          certification_type_id?: string
          created_at?: string
          document_url?: string | null
          expiration_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_certification_type_id_fkey"
            columns: ["certification_type_id"]
            isOneToOne: false
            referencedRelation: "certification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hitch_log_history: {
        Row: {
          changed_at: string
          changed_by: string
          field_changed: string
          hitch_log_id: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          field_changed: string
          hitch_log_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          field_changed?: string
          hitch_log_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hitch_log_history_hitch_log_id_fkey"
            columns: ["hitch_log_id"]
            isOneToOne: false
            referencedRelation: "hitch_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      hitch_logs: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assignment_id: string
          created_at: string
          id: string
          logged_by: string
          notes: string | null
          scheduled_end: string
          scheduled_start: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assignment_id: string
          created_at?: string
          id?: string
          logged_by: string
          notes?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assignment_id?: string
          created_at?: string
          id?: string
          logged_by?: string
          notes?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: []
      }
      note_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      project_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_statuses: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_closed: boolean
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_closed?: boolean
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_closed?: boolean
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      vendor_contacts: {
        Row: {
          created_at: string
          email: string | null
          fax: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          fax?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          fax?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_notes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          primary_contact_email: string | null
          primary_contact_fax: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          state: string | null
          status: string
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_fax?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_fax?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      worker_notes: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          updated_at: string | null
          visibility: string
          worker_id: string
        }
        Insert: {
          author_id: string
          category: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string | null
          visibility?: string
          worker_id: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string | null
          visibility?: string
          worker_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_role: { Args: never; Returns: string }
      app_user_id: { Args: never; Returns: string }
      create_audit_log: {
        Args: {
          p_action: string
          p_changed_by: string
          p_entity_id: string
          p_entity_type: string
          p_field_changed: string
          p_metadata: Json
          p_new_value: string
          p_old_value: string
        }
        Returns: string
      }
      get_worker_hitch_status: {
        Args: { p_reference_date?: string; p_worker_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  api: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
