// src/hooks/customers/useCustomer.ts
import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "@/services/api/customers/customers.service";
import { customersKeys } from "./queryKeys";

export function useCustomer(customerId?: string) {
  return useQuery({
    queryKey: customerId ? customersKeys.detail(customerId) : ["customers", "detail", "missing-id"],
    queryFn: () => {
      if (!customerId) throw new Error("customerId is required");
      return getCustomer(customerId);
    },
    enabled: !!customerId,
    staleTime: 30_000,
  });
}