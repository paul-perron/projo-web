// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { validateSupabaseEnv } from "../config/validateEnv";

const env = validateSupabaseEnv();
const url = env.url as string;
const key = env.key as string;

/**
 * DEV-safe singleton (prevents multiple GoTrueClient instances under Vite HMR)
 *
 * IMPORTANT:
 * - We create ONE Supabase client
 * - We FORCE PostgREST schema to "api" (default + headers)
 * - We also export a schema-scoped PostgREST client `api`
 *
 * NOTE: If you previously created a client without db.schema="api",
 * Vite HMR can keep the old instance alive. We bump the cache key.
 */
type AnySupabase = SupabaseClient<any, any, any, any>;

const globalForSupabase = globalThis as unknown as {
  __projo_supabase_v3__?: AnySupabase;
};

export const supabase: AnySupabase =
  globalForSupabase.__projo_supabase_v3__ ??
  createClient(url, key, {
    // Default schema for ALL .from(...) calls made off `supabase`
    db: { schema: "api" },

    // Belt + suspenders: ensure PostgREST always targets api schema
    global: {
      headers: {
        "Accept-Profile": "api",
        "Content-Profile": "api",
      },
    },

    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

if (import.meta.env.DEV) {
  globalForSupabase.__projo_supabase_v3__ = supabase;
}

/**
 * Schema-scoped PostgREST client (preferred for all app-table queries)
 * Ensures requests include `Accept-Profile: api`.
 */
export const api = supabase.schema("api");

export class SupabaseServiceError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "SupabaseServiceError";
    this.code = code;
  }
}

export function mapSupabaseError(error: PostgrestError | null, context: string): never | void {
  if (!error) return;

  const errorMap: Record<string, string> = {
    PGRST301: "You do not have permission to perform this action.",
    "42501": "You do not have permission to perform this action.",
    "23505": "This record already exists.",
  };

  const friendly = errorMap[error.code || ""];
  if (friendly) throw new SupabaseServiceError(friendly, error.code);

  throw new SupabaseServiceError(`Failed to ${context}: ${error.message}`, error.code);
}

/**
 * IMPORTANT: helpers default to `api` (schema-scoped), NOT `supabase.from(...)`
 * so we never accidentally hit Accept-Profile: public.
 */
export async function selectSingle<T>(
  table: string,
  match: Record<string, unknown>,
  context: string,
  client: typeof api = api
): Promise<T> {
  const { data, error } = await client.from(table).select("*").match(match).single<T>();
  if (error) mapSupabaseError(error, context);
  return data as T;
}

export async function selectMany<T>(
  table: string,
  filter: Record<string, unknown> | null,
  context: string,
  client: typeof api = api
): Promise<T[]> {
  let query = client.from(table).select("*");
  if (filter) query = query.match(filter);

  const { data, error } = await query.returns<T[]>();
  if (error) mapSupabaseError(error, context);

  return (data ?? []) as T[];
}