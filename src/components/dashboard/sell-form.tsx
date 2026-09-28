"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateSellAmount } from "@/lib/decimal";
import { formatToman, toEnglishDigits } from "@/lib/format";
import type { MarketDto, UserDto } from "@/lib/types";

export function SellForm({
  market,
  user,
  submitting,
  onSubmit,
}: {
  market: MarketDto | null;
  user: UserDto | null;
  submitting: boolean;
  onSubmit: (weight: string) => Promise<void>;
}) {
  const [weight, setWeight] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const estimated = useMemo(() => {
    const normalized = toEnglishDigits(weight);
    if (!market || !normalized) {
      return null;
    }
    try {
      const amount = calculateSellAmount(normalized, market.sellPricePerGram);
      if (amount.lte(0)) {
        return null;
      }
      return amount.toString();
    } catch {
      return null;
    }
  }, [weight, market]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    const normalized = toEnglishDigits(weight);
    if (!normalized || Number(normalized) <= 0) {
      setLocalError("وزن باید بزرگ‌تر از صفر باشد.");
      return;
    }
    if (user && Number(normalized) > Number(user.silverBalance)) {
      setLocalError("موجودی نقره شما برای این فروش کافی نیست.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit(normalized);
      setWeight("");
    } catch {
      // Parent surfaces the API error.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>فروش نقره</CardTitle>
        <CardDescription>وزن نقره را به گرم وارد کنید. مبلغ تقریبی همان لحظه محاسبه می‌شود.</CardDescription>
      </CardHeader>
      <form className="space-y-4" method="dialog" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="sell-weight">وزن نقره</Label>
          <Input
            id="sell-weight"
            inputMode="decimal"
            placeholder="مثلاً ۲۵.۵"
            value={weight}
            disabled={submitting}
            onChange={(event) => setWeight(event.target.value)}
          />
        </div>
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {estimated
            ? `شما حدوداً ${formatToman(estimated)} دریافت می‌کنید.`
            : "برای دیدن مبلغ تقریبی، وزن را وارد کنید."}
        </p>
        {localError ? <p className="text-sm text-rose-700">{localError}</p> : null}
        <Button type="submit" variant="sell" className="w-full" disabled={submitting || !market}>
          {submitting ? "در حال فروش..." : "فروش نقره"}
        </Button>
      </form>
    </Card>
  );
}
