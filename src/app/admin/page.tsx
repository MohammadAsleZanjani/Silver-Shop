import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { SiteHeader } from "@/components/site-header";
import { getMarket } from "@/services/market.service";
import { listAdminTransactions } from "@/services/transaction.service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [market, history] = await Promise.all([
    getMarket(),
    listAdminTransactions({ page: 1, limit: 20 }),
  ]);

  return (
    <div className="min-h-full">
      <SiteHeader current="admin" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold">پنل مدیریت بازار</h1>
          <p className="mt-1 text-sm text-zinc-600">
            قیمت را دستی وارد کنید یا از API جی‌تی‌ای بگیرید. موجودی نقره همچنان دستی است. این نسخه
            احراز هویت ندارد.
          </p>
        </div>
        <AdminDashboard
          initialMarket={market}
          initialTransactions={history.data}
          initialPagination={history.pagination}
        />
      </main>
    </div>
  );
}
