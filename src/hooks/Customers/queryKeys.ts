// src/hooks/customers/queryKeys.ts
export const customersKeys = {
  all: ["customers"] as const,
  lists: () => [...customersKeys.all, "list"] as const,
  list: (params: { page: number; pageSize: number; search?: string }) =>
    [...customersKeys.lists(), params] as const,
  details: () => [...customersKeys.all, "detail"] as const,
  detail: (id: string) => [...customersKeys.details(), id] as const,
  subCustomers: (customerId: string, params: { page: number; pageSize: number; search?: string }) =>
    [...customersKeys.all, "subCustomers", customerId, params] as const,
};