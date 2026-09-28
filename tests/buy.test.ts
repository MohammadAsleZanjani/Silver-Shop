import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { AppError, ErrorCode } from "@/lib/errors";
import { Decimal } from "@/lib/decimal";
import { buySilver } from "@/services/order.service";
import { POST as buyPost } from "@/app/api/orders/buy/route";
import { getMarketRow, getUser, newKey, resetDb, eqDecimal } from "./helpers";

describe("buy silver", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("buys silver successfully", async () => {
    const result = await buySilver(new Decimal("10000000"), newKey());

    expect(result.order.type).toBe("buy");
    expect(result.order.weight).toBe("40");
    expect(result.order.pricePerGram).toBe("250000");
    expect(result.order.totalAmount).toBe("10000000");
    expect(result.balance.cash).toBe("90000000");
    expect(result.balance.silver).toBe("140");

    const user = await getUser();
    const market = await getMarketRow();
    expect(eqDecimal(user.cashBalance, "90000000")).toBe(true);
    expect(eqDecimal(user.silverBalance, "140")).toBe(true);
    expect(eqDecimal(market.silverInventory, "9960")).toBe(true);
    expect(await prisma.transaction.count()).toBe(1);
    expect(await prisma.order.count()).toBe(1);
  });

  it("rejects invalid, zero and negative amounts", async () => {
    await expect(buySilver(new Decimal("0"), newKey())).rejects.toMatchObject({
      code: ErrorCode.INVALID_AMOUNT,
      status: 400,
    });
    await expect(buySilver(new Decimal("-1000"), newKey())).rejects.toMatchObject({
      code: ErrorCode.INVALID_AMOUNT,
    });

    const response = await buyPost(
      new Request("http://localhost/api/orders/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": newKey(),
        },
        body: JSON.stringify({ amount: "abc" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.INVALID_AMOUNT);
  });

  it("rejects insufficient cash", async () => {
    await resetDb({ cashBalance: "1000" });
    await expect(buySilver(new Decimal("10000000"), newKey())).rejects.toMatchObject({
      code: ErrorCode.INSUFFICIENT_CASH_BALANCE,
      status: 409,
    });
    const user = await getUser();
    expect(eqDecimal(user.cashBalance, "1000")).toBe(true);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it("rejects insufficient market silver", async () => {
    await resetDb({ silverInventory: "1" });
    await expect(buySilver(new Decimal("10000000"), newKey())).rejects.toMatchObject({
      code: ErrorCode.INSUFFICIENT_MARKET_SILVER,
      status: 409,
    });
  });

  it("rejects missing buy price", async () => {
    await resetDb({ buyPricePerGram: "0" });
    await expect(buySilver(new Decimal("10000000"), newKey())).rejects.toMatchObject({
      code: ErrorCode.PRICE_UNAVAILABLE,
      status: 503,
    });
  });

  it("snapshots the price even after admin changes it", async () => {
    const first = await buySilver(new Decimal("10000000"), newKey());
    expect(first.order.pricePerGram).toBe("250000");

    await prisma.market.update({
      where: { id: "default-market" },
      data: { buyPricePerGram: "260000" },
    });

    const second = await buySilver(new Decimal("10000000"), newKey());
    expect(second.order.pricePerGram).toBe("260000");

    const original = await prisma.transaction.findFirstOrThrow({
      orderBy: { createdAt: "asc" },
    });
    expect(eqDecimal(original.pricePerGram, "250000")).toBe(true);
  });

  it("returns the original order for a duplicate idempotency key", async () => {
    const key = newKey();
    const first = await buySilver(new Decimal("10000000"), key);
    const second = await buySilver(new Decimal("10000000"), key);

    expect(second.order.id).toBe(first.order.id);
    expect(await prisma.transaction.count()).toBe(1);
    const user = await getUser();
    expect(eqDecimal(user.cashBalance, "90000000")).toBe(true);
  });

  it("rejects reused idempotency key with a different payload", async () => {
    const key = newKey();
    await buySilver(new Decimal("1000000"), key);
    await expect(buySilver(new Decimal("5000000"), key)).rejects.toMatchObject({
      code: ErrorCode.IDEMPOTENCY_KEY_REUSED,
      status: 409,
    });
  });

  it("requires a valid idempotency key on the HTTP API", async () => {
    const response = await buyPost(
      new Request("http://localhost/api/orders/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "10000000" }),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.INVALID_IDEMPOTENCY_KEY);
  });

  it("exposes AppError for typed failures", () => {
    const error = new AppError(ErrorCode.INVALID_AMOUNT, "nope", 400);
    expect(error).toBeInstanceOf(AppError);
  });
});
