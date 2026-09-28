import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ErrorCode } from "@/lib/errors";
import { Decimal } from "@/lib/decimal";
import { sellSilver } from "@/services/order.service";
import { POST as sellPost } from "@/app/api/orders/sell/route";
import { getMarketRow, getUser, newKey, resetDb, eqDecimal } from "./helpers";

describe("sell silver", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sells silver successfully", async () => {
    const result = await sellSilver(new Decimal("25.5"), newKey());

    expect(result.order.type).toBe("sell");
    expect(result.order.weight).toBe("25.5");
    expect(result.order.pricePerGram).toBe("230000");
    expect(result.order.totalAmount).toBe("5865000");
    expect(result.balance.cash).toBe("105865000");
    expect(result.balance.silver).toBe("74.5");

    const market = await getMarketRow();
    expect(eqDecimal(market.silverInventory, "10025.5")).toBe(true);
    expect(await prisma.transaction.count()).toBe(1);
  });

  it("rejects invalid, zero and negative weights", async () => {
    await expect(sellSilver(new Decimal("0"), newKey())).rejects.toMatchObject({
      code: ErrorCode.INVALID_WEIGHT,
      status: 400,
    });
    await expect(sellSilver(new Decimal("-2"), newKey())).rejects.toMatchObject({
      code: ErrorCode.INVALID_WEIGHT,
    });

    const response = await sellPost(
      new Request("http://localhost/api/orders/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": newKey(),
        },
        body: JSON.stringify({ weight: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.INVALID_WEIGHT);
  });

  it("rejects insufficient silver", async () => {
    await expect(sellSilver(new Decimal("500"), newKey())).rejects.toMatchObject({
      code: ErrorCode.INSUFFICIENT_SILVER_BALANCE,
      status: 409,
    });
    const user = await getUser();
    expect(eqDecimal(user.silverBalance, "100")).toBe(true);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it("rejects missing sell price", async () => {
    await resetDb({ sellPricePerGram: "0" });
    await expect(sellSilver(new Decimal("10"), newKey())).rejects.toMatchObject({
      code: ErrorCode.PRICE_UNAVAILABLE,
      status: 503,
    });
  });

  it("is idempotent for the same key", async () => {
    const key = newKey();
    const first = await sellSilver(new Decimal("10"), key);
    const second = await sellSilver(new Decimal("10"), key);
    expect(second.order.id).toBe(first.order.id);
    expect(await prisma.order.count()).toBe(1);
  });
});
