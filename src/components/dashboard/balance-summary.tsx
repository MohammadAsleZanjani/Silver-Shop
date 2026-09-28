import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateSilverAssetValue } from "@/lib/decimal";
import { formatGram, formatToman } from "@/lib/format";
import type { MarketDto, UserDto } from "@/lib/types";

export function BalanceSummary({
  user,
  market,
  loading,
}: {
  user: UserDto | null;
  market: MarketDto | null;
  loading?: boolean;
}) {
  const estimatedValue =
    user && market
      ? calculateSilverAssetValue(user.silverBalance, market.sellPricePerGram).toString()
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>موجودی شما</CardTitle>
        <CardDescription>نقد، نقره و ارزش تقریبی دارایی نقره</CardDescription>
      </CardHeader>
      {loading || !user ? (
        <p className="text-sm text-zinc-500">در حال بارگذاری موجودی...</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">موجودی نقدی</p>
            <p className="mt-1 text-lg font-semibold">{formatToman(user.cashBalance)}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">موجودی نقره</p>
            <p className="mt-1 text-lg font-semibold">{formatGram(user.silverBalance)}</p>
          </div>
          <div className="rounded-xl border border-dashed border-zinc-200 p-4">
            <p className="text-xs text-zinc-500">ارزش تقریبی دارایی نقره</p>
            <p className="mt-1 text-base font-medium">
              {estimatedValue ? formatToman(estimatedValue) : "—"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              این مبلغ تخمینی است و مبلغ قطعی قابل دریافت محسوب نمی‌شود.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
