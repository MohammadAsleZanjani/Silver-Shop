import { Decimal, toApiDecimal } from "@/lib/decimal";

export type OrderTypeDto = "buy" | "sell";

export type OrderDto = {
  id: string;
  type: OrderTypeDto;
  weight: string;
  pricePerGram: string;
  totalAmount: string;
  createdAt: string;
};

export type TransactionDto = {
  id: string;
  type: OrderTypeDto;
  weight: string;
  pricePerGram: string;
  totalAmount: string;
  createdAt: string;
};

export type BalanceDto = {
  cash: string;
  silver: string;
};

export type MarketDto = {
  buyPricePerGram: string;
  sellPricePerGram: string;
  silverInventory: string;
  updatedAt: string;
};

export type GtaQuoteDto = {
  source: "gta";
  buyPricePerGram: string;
  sellPricePerGram: string;
  purity: "990";
  unit: "gram";
  currency: "toman";
  spreadFromFeed: boolean;
  quoteFetchedAt: string;
  live: {
    price_990: string;
    price_925: string | null;
    mesghal: string | null;
    troy_ounce_usd: string | null;
    change_percent: number | null;
    is_bullish: boolean | null;
    updated_at: string | null;
    updated_at_jalali: string | null;
    stale: boolean;
  };
};

export type PaginationDto = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserDto = {
  cashBalance: string;
  silverBalance: string;
};

export function toOrderTypeDto(type: "BUY" | "SELL"): OrderTypeDto {
  return type === "BUY" ? "buy" : "sell";
}

export function serializeMoney(value: Decimal.Value): string {
  return toApiDecimal(value);
}

export function serializeWeight(value: Decimal.Value): string {
  return toApiDecimal(value);
}
