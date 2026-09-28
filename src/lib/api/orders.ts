import { apiFetch } from "@/lib/api/client";
import type { BalanceDto, OrderDto } from "@/lib/types";

export async function buySilver(amount: string) {
  return apiFetch<{ order: OrderDto; balance: BalanceDto }>("/api/orders/buy", {
    method: "POST",
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ amount }),
  });
}

export async function sellSilver(weight: string) {
  return apiFetch<{ order: OrderDto; balance: BalanceDto }>("/api/orders/sell", {
    method: "POST",
    headers: {
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ weight }),
  });
}
