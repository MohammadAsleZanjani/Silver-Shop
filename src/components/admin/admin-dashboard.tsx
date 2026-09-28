"use client";

import { useState } from "react";
import { MarketForm } from "@/components/admin/market-form";
import { TransactionTable } from "@/components/admin/transaction-table";
import { fetchAdminTransactions } from "@/lib/api/transactions";
import type { MarketDto, PaginationDto, TransactionDto } from "@/lib/types";

export function AdminDashboard({
  initialMarket,
  initialTransactions,
  initialPagination,
}: {
  initialMarket: MarketDto;
  initialTransactions: TransactionDto[];
  initialPagination: PaginationDto;
}) {
  const [market, setMarket] = useState(initialMarket);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  async function handlePageChange(page: number) {
    setLoading(true);
    try {
      const result = await fetchAdminTransactions(page, 20);
      setTransactions(result.data);
      setPagination(result.pagination);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarketUpdated(next: MarketDto) {
    setMarket(next);
    const result = await fetchAdminTransactions(pagination.page, 20);
    setTransactions(result.data);
    setPagination(result.pagination);
  }

  return (
    <div className="space-y-6">
      <MarketForm market={market} onUpdated={handleMarketUpdated} />
      <TransactionTable
        items={transactions}
        pagination={pagination}
        loading={loading}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
