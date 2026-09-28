"use client";

import { useState } from "react";
import { BalanceSummary } from "@/components/dashboard/balance-summary";
import { BuyForm } from "@/components/dashboard/buy-form";
import { MarketSummary } from "@/components/dashboard/market-summary";
import { SellForm } from "@/components/dashboard/sell-form";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { fetchMarket } from "@/lib/api/market";
import { fetchMe } from "@/lib/api/me";
import { buySilver, sellSilver } from "@/lib/api/orders";
import { fetchTransactions } from "@/lib/api/transactions";
import { ApiRequestError } from "@/lib/api/client";
import type { MarketDto, PaginationDto, TransactionDto, UserDto } from "@/lib/types";

const HISTORY_LIMIT = 5;

export function TradingDashboard({
  initialMarket,
  initialUser,
  initialTransactions,
  initialPagination,
}: {
  initialMarket: MarketDto;
  initialUser: UserDto;
  initialTransactions: TransactionDto[];
  initialPagination: PaginationDto;
}) {
  const [market, setMarket] = useState(initialMarket);
  const [user, setUser] = useState(initialUser);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [pagination, setPagination] = useState(initialPagination);
  const [buying, setBuying] = useState(false);
  const [selling, setSelling] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function refresh(page = pagination.page) {
    const [nextMarket, nextUser, history] = await Promise.all([
      fetchMarket(),
      fetchMe(),
      fetchTransactions(page, HISTORY_LIMIT),
    ]);
    setMarket(nextMarket);
    setUser(nextUser);
    setTransactions(history.data);
    setPagination(history.pagination);
  }

  async function handleBuy(amount: string) {
    setBuying(true);
    setMessage(null);
    try {
      const result = await buySilver(amount);
      setUser({
        cashBalance: result.balance.cash,
        silverBalance: result.balance.silver,
      });
      await refresh(1);
      setMessage({
        type: "success",
        text: `خرید انجام شد. ${result.order.weight} گرم نقره به موجودی شما اضافه شد.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof ApiRequestError ? error.message : "خرید انجام نشد.",
      });
      throw error;
    } finally {
      setBuying(false);
    }
  }

  async function handleSell(weight: string) {
    setSelling(true);
    setMessage(null);
    try {
      const result = await sellSilver(weight);
      setUser({
        cashBalance: result.balance.cash,
        silverBalance: result.balance.silver,
      });
      await refresh(1);
      setMessage({
        type: "success",
        text: `فروش انجام شد. ${result.order.totalAmount} تومان به موجودی نقدی شما اضافه شد.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof ApiRequestError ? error.message : "فروش انجام نشد.",
      });
      throw error;
    } finally {
      setSelling(false);
    }
  }

  async function handlePageChange(page: number) {
    setLoadingHistory(true);
    try {
      const history = await fetchTransactions(page, HISTORY_LIMIT);
      setTransactions(history.data);
      setPagination(history.pagination);
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900"
              : "bg-rose-50 text-rose-900"
          }`}
        >
          {message.text}
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <MarketSummary market={market} />
        <BalanceSummary user={user} market={market} />
        <BuyForm market={market} submitting={buying} onSubmit={handleBuy} />
        <SellForm market={market} user={user} submitting={selling} onSubmit={handleSell} />
      </div>
      <TransactionHistory
        items={transactions}
        pagination={pagination}
        loading={loadingHistory}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
