import { SiteHeader } from "@/components/site-header";
import { TradingDashboard } from "@/components/dashboard/trading-dashboard";
import { getMarket } from "@/services/market.service";
import { getCurrentUser } from "@/services/user.service";
import { listTransactions } from "@/services/transaction.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [market, user, history] = await Promise.all([
    getMarket(),
    getCurrentUser(),
    listTransactions({ page: 1, limit: 5 }),
  ]);

  return (
    <div className="min-h-full">
      <SiteHeader current="dashboard" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold">داشبورد معاملات نقره</h1>
          <p className="mt-1 text-sm text-zinc-600">
            موجودی نقدی و نقره را ببینید، با مبلغ خرید کنید و با وزن بفروشید.
          </p>
        </div>
        <TradingDashboard
          initialMarket={market}
          initialUser={user}
          initialTransactions={history.data}
          initialPagination={history.pagination}
        />
      </main>
    </div>
  );
}
