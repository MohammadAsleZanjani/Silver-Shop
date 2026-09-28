"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateBuyWeight } from "@/lib/decimal";
import { formatGram, toEnglishDigits } from "@/lib/format";
import type { MarketDto } from "@/lib/types";

export function BuyForm({
  market,
  submitting,
  onSubmit,
}: {
  market: MarketDto | null;
  submitting: boolean;
  onSubmit: (amount: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const estimated = useMemo(() => {
    const normalized = toEnglishDigits(amount);
    if (!market || !normalized) {
      return null;
    }
    try {
      const weight = calculateBuyWeight(normalized, market.buyPricePerGram);
      if (weight.lte(0)) {
        return null;
      }
      return weight.toString();
    } catch {
      return null;
    }
  }, [amount, market]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = toEnglishDigits(amount);
    if (!normalized || Number(normalized) <= 0) {
      setLocalError("مبلغ باید بزرگ‌تر از صفر باشد.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit(normalized);
      setAmount("");
    } catch {
      // Parent surfaces the API error.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>خرید نقره</CardTitle>
        <CardDescription>مبلغ را به تومان وارد کنید. وزن تقریبی همان لحظه محاسبه می‌شود.</CardDescription>
      </CardHeader>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="buy-amount">مبلغ خرید</Label>
          <Input
            id="buy-amount"
            inputMode="decimal"
            placeholder="مثلاً ۱۰۰۰۰۰۰۰"
            value={amount}
            disabled={submitting}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {estimated
            ? `شما حدوداً ${formatGram(estimated)} نقره دریافت می‌کنید.`
            : "برای دیدن وزن تقریبی، مبلغ را وارد کنید."}
        </p>
        {localError ? <p className="text-sm text-rose-700">{localError}</p> : null}
        <Button type="submit" variant="buy" className="w-full" disabled={submitting || !market}>
          {submitting ? "در حال خرید..." : "خرید نقره"}
        </Button>
      </form>
    </Card>
  );
}
