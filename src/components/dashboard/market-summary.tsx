import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatToman } from "@/lib/format";
import type { MarketDto } from "@/lib/types";

export function MarketSummary({ market, loading }: { market: MarketDto | null; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>قیمت بازار</CardTitle>
        <CardDescription>قیمت خرید و فروش هر گرم نقره در لحظه</CardDescription>
      </CardHeader>
      {loading || !market ? (
        <p className="text-sm text-zinc-500">در حال بارگذاری قیمت بازار...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">قیمت خرید هر گرم</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatToman(market.buyPricePerGram)}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">قیمت فروش هر گرم</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{formatToman(market.sellPricePerGram)}</p>
          </div>
          <p className="text-xs text-zinc-500 sm:col-span-2">
            آخرین بروزرسانی: {formatDateTime(market.updatedAt)}
          </p>
        </div>
      )}
    </Card>
  );
}
