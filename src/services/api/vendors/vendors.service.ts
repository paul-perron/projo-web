import { supabase } from "@/services/supabase";

export type ListVendorsParams = {
  q?: string;
  status?: "active" | "inactive" | "all";
};

export async function listVendors(params: ListVendorsParams = {}) {
  let query = supabase.from("vendors").select("*").order("name", { ascending: true });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.q?.trim()) {
    const like = `%${params.q.trim()}%`;
    query = query.ilike("name", like);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createVendor(input: any) {
  const { data, error } = await supabase.from("vendors").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateVendor(id: string, patch: any) {
  const { data, error } = await supabase.from("vendors").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function getVendor(id: string) {
  const { data, error } = await supabase.from("vendors").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}