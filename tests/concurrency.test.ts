import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@/lib/decimal";
import { buySilver, sellSilver } from "@/services/order.service";
import { getUser, newKey, resetDb, eqDecimal } from "./helpers";

describe("concurrency", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("allows only one concurrent buy when cash is not enough for both", async () => {
    await resetDb({ cashBalance: "1000000", silverBalance: "100" });

    const results = await Promise.allSettled([
      buySilver(new Decimal("600000"), newKey()),
      buySilver(new Decimal("600000"), newKey()),
    ]);

    const fulfilled = results.filter((item) => item.status === "fulfilled");
    const rejected = results.filter((item) => item.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.code).toBe("INSUFFICIENT_CASH_BALANCE");

    const user = await getUser();
    expect(eqDecimal(user.cashBalance, "400000")).toBe(true);
    expect(eqDecimal(user.silverBalance, "102.4")).toBe(true);
    expect(await prisma.transaction.count()).toBe(1);
    expect(new Decimal(user.cashBalance.toString()).isNegative()).toBe(false);
  });

  it("allows only one concurrent sell when silver is not enough for both", async () => {
    await resetDb({ silverBalance: "10" });

    const results = await Promise.allSettled([
      sellSilver(new Decimal("8"), newKey()),
      sellSilver(new Decimal("8"), newKey()),
    ]);

    const fulfilled = results.filter((item) => item.status === "fulfilled");
    const rejected = results.filter((item) => item.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.code).toBe("INSUFFICIENT_SILVER_BALANCE");

    const user = await getUser();
    expect(eqDecimal(user.silverBalance, "2")).toBe(true);
    expect(await prisma.transaction.count()).toBe(1);
  });
});
