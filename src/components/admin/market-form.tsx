"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMarket } from "@/lib/api/market";
import { ApiRequestError } from "@/lib/api/client";
import { toEnglishDigits } from "@/lib/format";
import type { MarketDto } from "@/lib/types";

export function MarketForm({
  market,
  onUpdated,
}: {
  market: MarketDto;
  onUpdated: (market: MarketDto) => void;
}) {
  const [buyPricePerGram, setBuyPricePerGram] = useState(market.buyPricePerGram);
  const [sellPricePerGram, setSellPricePerGram] = useState(market.sellPricePerGram);
  const [silverInventory, setSilverInventory] = useState(market.silverInventory);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const next = await updateMarket({
        buyPricePerGram: toEnglishDigits(buyPricePerGram),
        sellPricePerGram: toEnglishDigits(sellPricePerGram),
        silverInventory: toEnglishDigits(silverInventory),
      });
      onUpdated(next);
      setBuyPricePerGram(next.buyPricePerGram);
      setSellPricePerGram(next.sellPricePerGram);
      setSilverInventory(next.silverInventory);
      setMessage({ type: "success", text: "تنظیمات بازار با موفقیت به‌روزرسانی شد." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof ApiRequestError ? error.message : "به‌روزرسانی بازار انجام نشد.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تنظیمات بازار</CardTitle>
        <CardDescription>قیمت خرید، قیمت فروش و موجودی نقره بازار را مشخص کنید.</CardDescription>
      </CardHeader>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="buy-price">قیمت خرید هر گرم</Label>
          <Input
            id="buy-price"
            value={buyPricePerGram}
            disabled={submitting}
            onChange={(event) => setBuyPricePerGram(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sell-price">قیمت فروش هر گرم</Label>
          <Input
            id="sell-price"
            value={sellPricePerGram}
            disabled={submitting}
            onChange={(event) => setSellPricePerGram(event.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="inventory">موجودی نقره بازار (گرم)</Label>
          <Input
            id="inventory"
            value={silverInventory}
            disabled={submitting}
            onChange={(event) => setSilverInventory(event.target.value)}
          />
        </div>
        {message ? (
          <p
            className={`sm:col-span-2 text-sm ${
              message.type === "success" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {message.text}
          </p>
        ) : null}
        <Button type="submit" className="sm:col-span-2" disabled={submitting}>
          {submitting ? "در حال به‌روزرسانی بازار..." : "به‌روزرسانی بازار"}
        </Button>
      </form>
    </Card>
  );
}
