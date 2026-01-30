// src/hooks/customers/useCustomers.ts
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/services/api/customers/customers.service";
import { customersKeys } from "./queryKeys";

export type UseCustomersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export function useCustomers(params: UseCustomersParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const search = params.search?.trim() || undefined;

  return useQuery({
    queryKey: customersKeys.list({ page, pageSize, search }),
    queryFn: () => listCustomers({ page, pageSize, search }),
    staleTime: 30_000,
  });
}