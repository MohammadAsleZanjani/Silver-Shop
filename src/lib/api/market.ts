import { apiFetch } from "@/lib/api/client";
import type { MarketDto } from "@/lib/types";

export async function fetchMarket() {
  const result = await apiFetch<{ data: MarketDto }>("/api/market");
  return result.data;
}

export async function updateMarket(input: {
  buyPricePerGram: string;
  sellPricePerGram: string;
  silverInventory: string;
}) {
  const result = await apiFetch<{ data: MarketDto }>("/api/admin/market", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return result.data;
}
