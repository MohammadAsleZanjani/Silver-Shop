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
