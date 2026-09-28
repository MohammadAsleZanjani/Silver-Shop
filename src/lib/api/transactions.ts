import { apiFetch } from "@/lib/api/client";
import type { PaginationDto, TransactionDto } from "@/lib/types";

export async function fetchTransactions(page = 1, limit = 5) {
  return apiFetch<{ data: TransactionDto[]; pagination: PaginationDto }>(
    `/api/transactions?page=${page}&limit=${limit}`,
  );
}

export async function fetchAdminTransactions(page = 1, limit = 20) {
  return apiFetch<{ data: TransactionDto[]; pagination: PaginationDto }>(
    `/api/admin/transactions?page=${page}&limit=${limit}`,
  );
}

export async function fetchTransaction(id: string) {
  const result = await apiFetch<{ data: TransactionDto }>(`/api/transactions/${id}`);
  return result.data;
}
