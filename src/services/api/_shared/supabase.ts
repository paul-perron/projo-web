// src/services/api/_shared/supabase.ts
/**
 * Shared PostgREST client for API services.
 *
 * IMPORTANT:
 * - Do NOT create another Supabase client here.
 * - Always use the schema-scoped `api` exported from "@/services/supabase".
 *   This guarantees requests include: Accept-Profile: api
 */
export { api } from "@/services/supabase";