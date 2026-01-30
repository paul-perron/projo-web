// src/hooks/customers/useCustomerMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from "@/services/api/customers/customers.service";
import { customersKeys } from "./queryKeys";

export function useCustomerMutations() {
  const qc = useQueryClient();

  const invalidateAllCustomers = async () => {
    await qc.invalidateQueries({ queryKey: customersKeys.all });
  };

  const create = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (created: Customer) => {  // ✅ Add type annotation
      await invalidateAllCustomers();
      qc.setQueryData(customersKeys.detail(created.id), created);
    },
  });

  const update = useMutation({
    mutationFn: ({ customerId, patch }: { customerId: string; patch: Partial<Customer> }) =>
      updateCustomer(customerId, patch),
    onSuccess: async (updated: Customer) => {  // ✅ Add type annotation
      await invalidateAllCustomers();
      qc.setQueryData(customersKeys.detail(updated.id), updated);
    },
  });

  const deactivate = useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: async (updated: Customer) => {  // ✅ Add type annotation
      await invalidateAllCustomers();
      qc.setQueryData(customersKeys.detail(updated.id), updated);
    },
  });

  return { create, update, deactivate };
}