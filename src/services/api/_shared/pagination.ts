// src/services/api/_shared/pagination.ts
export type ListParams = {
  page?: number;      // 1-based
  pageSize?: number;  // items per page
  search?: string;
};

export const DEFAULT_PAGE_SIZE = 25;

/**
 * Convert (page, pageSize) into a Supabase range() pair.
 * Supabase uses 0-based inclusive ranges: .range(from, to)
 */
export function toRange(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 200); // guardrail

  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;

  return { from, to, page: safePage, pageSize: safeSize };
}