import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createVendor, getVendor, listVendors, updateVendor, type ListVendorsParams } from "./vendors.service";

const keys = {
  all: ["vendors"] as const,
  list: (params: ListVendorsParams) => [...keys.all, "list", params] as const,
  one: (id: string) => [...keys.all, "one", id] as const,
};

export function useVendorsList(params: ListVendorsParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => listVendors(params),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: keys.one(id),
    queryFn: () => getVendor(id),
    enabled: Boolean(id),
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => updateVendor(id, patch),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.invalidateQueries({ queryKey: keys.one(vars.id) });
    },
  });
}