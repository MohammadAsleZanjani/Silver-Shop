"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyGtaQuote, fetchGtaQuote, updateMarket } from "@/lib/api/market";
import { ApiRequestError } from "@/lib/api/client";
import { formatToman, toEnglishDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GtaQuoteDto, MarketDto } from "@/lib/types";

type PriceMode = "manual" | "api";

export function MarketForm({
  market,
  onUpdated,
}: {
  market: MarketDto;
  onUpdated: (market: MarketDto) => void;
}) {
  const [mode, setMode] = useState<PriceMode>("manual");
  const [buyPricePerGram, setBuyPricePerGram] = useState(market.buyPricePerGram);
  const [sellPricePerGram, setSellPricePerGram] = useState(market.sellPricePerGram);
  const [silverInventory, setSilverInventory] = useState(market.silverInventory);
  const [quote, setQuote] = useState<GtaQuoteDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    null,
  );

  function applyLocalMarket(next: MarketDto) {
    onUpdated(next);
    setBuyPricePerGram(next.buyPricePerGram);
    setSellPricePerGram(next.sellPricePerGram);
    setSilverInventory(next.silverInventory);
  }

  async function handleManualSubmit(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSubmitting(true);
    setMessage(null);
    try {
      const next = await updateMarket({
        buyPricePerGram: toEnglishDigits(buyPricePerGram),
        sellPricePerGram: toEnglishDigits(sellPricePerGram),
        silverInventory: toEnglishDigits(silverInventory),
      });
      applyLocalMarket(next);
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

  async function handleFetchQuote() {
    setFetchingQuote(true);
    setMessage(null);
    try {
      const nextQuote = await fetchGtaQuote();
      setQuote(nextQuote);
      setBuyPricePerGram(nextQuote.buyPricePerGram);
      setSellPricePerGram(nextQuote.sellPricePerGram);
      setMessage({
        type: "info",
        text: nextQuote.spreadFromFeed
          ? "قیمت لحظه‌ای GTA دریافت شد. برای ثبت روی بازار، اعمال قیمت را بزنید."
          : "نرخ لحظه‌ای عیار ۹۹۰ دریافت شد ولی فید خرید/فروش در دسترس نبود؛ هر دو فیلد برابر همین نرخ است. در صورت نیاز اسپرد را در حالت دستی تنظیم کنید.",
      });
    } catch (error) {
      setQuote(null);
      setMessage({
        type: "error",
        text:
          error instanceof ApiRequestError
            ? error.message
            : "دریافت قیمت از API انجام نشد.",
      });
    } finally {
      setFetchingQuote(false);
    }
  }

  async function handleApplyQuote(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await applyGtaQuote({
        silverInventory: toEnglishDigits(silverInventory),
      });
      setQuote(result.quote);
      applyLocalMarket(result.data);
      setMessage({ type: "success", text: "قیمت بازار از API جی‌تی‌ای اعمال شد." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof ApiRequestError ? error.message : "اعمال قیمت API انجام نشد.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تنظیمات بازار</CardTitle>
        <CardDescription>
          قیمت را دستی وارد کنید یا از وب‌سرویس GTA بگیرید. موجودی نقره در هر دو حالت دستی است.
        </CardDescription>
      </CardHeader>

      <div className="mb-5 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
        <button
          type="button"
          className={cn(
            "h-10 rounded-lg text-sm font-medium transition-colors",
            mode === "manual" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900",
          )}
          onClick={() => {
            setMode("manual");
            setMessage(null);
          }}
        >
          ورود دستی
        </button>
        <button
          type="button"
          className={cn(
            "h-10 rounded-lg text-sm font-medium transition-colors",
            mode === "api" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900",
          )}
          onClick={() => {
            setMode("api");
            setMessage(null);
          }}
        >
          دریافت از API
        </button>
      </div>

      {mode === "manual" ? (
        <form className="grid gap-4 sm:grid-cols-2" method="dialog" onSubmit={handleManualSubmit}>
          <PriceFields
            buyPricePerGram={buyPricePerGram}
            sellPricePerGram={sellPricePerGram}
            silverInventory={silverInventory}
            disabled={submitting}
            pricesReadOnly={false}
            onBuyChange={setBuyPricePerGram}
            onSellChange={setSellPricePerGram}
            onInventoryChange={setSilverInventory}
          />
          <StatusMessage message={message} />
          <Button type="submit" className="sm:col-span-2" disabled={submitting}>
            {submitting ? "در حال به‌روزرسانی بازار..." : "به‌روزرسانی بازار"}
          </Button>
        </form>
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" method="dialog" onSubmit={handleApplyQuote}>
          <div className="sm:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-700">
              قیمت از{" "}
              <a
                href="https://gtasilver.com/silver-price/api"
                className="underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                API قیمت نقره GTA
              </a>{" "}
              برای عیار ۹۹۰ ساچمه (تومان در هر گرم) خوانده می‌شود.
            </p>
            {quote ? <QuoteSummary quote={quote} /> : null}
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={fetchingQuote || submitting}
              onClick={handleFetchQuote}
            >
              {fetchingQuote ? "در حال دریافت قیمت..." : "دریافت قیمت لحظه‌ای"}
            </Button>
          </div>
          <PriceFields
            buyPricePerGram={buyPricePerGram}
            sellPricePerGram={sellPricePerGram}
            silverInventory={silverInventory}
            disabled={submitting || fetchingQuote}
            pricesReadOnly
            onBuyChange={setBuyPricePerGram}
            onSellChange={setSellPricePerGram}
            onInventoryChange={setSilverInventory}
          />
          <StatusMessage message={message} />
          <Button type="submit" className="sm:col-span-2" disabled={submitting || fetchingQuote || !quote}>
            {submitting ? "در حال اعمال قیمت API..." : "اعمال قیمت API روی بازار"}
          </Button>
        </form>
      )}
    </Card>
  );
}

function PriceFields({
  buyPricePerGram,
  sellPricePerGram,
  silverInventory,
  disabled,
  pricesReadOnly,
  onBuyChange,
  onSellChange,
  onInventoryChange,
}: {
  buyPricePerGram: string;
  sellPricePerGram: string;
  silverInventory: string;
  disabled: boolean;
  pricesReadOnly: boolean;
  onBuyChange: (value: string) => void;
  onSellChange: (value: string) => void;
  onInventoryChange: (value: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="buy-price">قیمت خرید هر گرم</Label>
        <Input
          id="buy-price"
          value={buyPricePerGram}
          readOnly={pricesReadOnly}
          disabled={disabled}
          onChange={(event) => onBuyChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sell-price">قیمت فروش هر گرم</Label>
        <Input
          id="sell-price"
          value={sellPricePerGram}
          readOnly={pricesReadOnly}
          disabled={disabled}
          onChange={(event) => onSellChange(event.target.value)}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="inventory">موجودی نقره بازار (گرم)</Label>
        <Input
          id="inventory"
          value={silverInventory}
          disabled={disabled}
          onChange={(event) => onInventoryChange(event.target.value)}
        />
      </div>
    </>
  );
}

function QuoteSummary({ quote }: { quote: GtaQuoteDto }) {
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
      <div className="rounded-lg bg-white p-3">
        <dt className="text-xs text-zinc-500">خرید کاربر از فروشگاه</dt>
        <dd className="mt-1 font-semibold">{formatToman(quote.buyPricePerGram)}</dd>
      </div>
      <div className="rounded-lg bg-white p-3">
        <dt className="text-xs text-zinc-500">فروش کاربر به فروشگاه</dt>
        <dd className="mt-1 font-semibold">{formatToman(quote.sellPricePerGram)}</dd>
      </div>
      <div className="sm:col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
        {quote.live.updated_at_jalali ? <span>زمان منبع: {quote.live.updated_at_jalali}</span> : null}
        {quote.live.change_percent !== null ? (
          <span className={quote.live.is_bullish ? "text-emerald-700" : "text-rose-700"}>
            تغییر: {quote.live.change_percent}٪
          </span>
        ) : null}
        {quote.live.stale ? <span className="text-amber-700">هشدار: نرخ منبع کهنه است.</span> : null}
      </div>
    </dl>
  );
}

function StatusMessage({
  message,
}: {
  message: { type: "success" | "error" | "info"; text: string } | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`sm:col-span-2 text-sm ${
        message.type === "success"
          ? "text-emerald-700"
          : message.type === "error"
            ? "text-rose-700"
            : "text-zinc-700"
      }`}
    >
      {message.text}
    </p>
  );
}
