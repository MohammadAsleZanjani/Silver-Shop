import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getMarket, PUT as putMarket } from "@/app/api/admin/market/route";
import { resetDb } from "./helpers";

describe("admin market api", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("reads and updates market settings", async () => {
    const current = await getMarket();
    expect(current.status).toBe(200);
    const currentBody = await current.json();
    expect(currentBody.data.buyPricePerGram).toBe("250000");

    const updated = await putMarket(
      new Request("http://localhost/api/admin/market", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyPricePerGram: "260000",
          sellPricePerGram: "240000",
          silverInventory: "9500",
        }),
      }),
    );
    expect(updated.status).toBe(200);
    const updatedBody = await updated.json();
    expect(updatedBody.data.buyPricePerGram).toBe("260000");
    expect(updatedBody.data.sellPricePerGram).toBe("240000");
    expect(updatedBody.data.silverInventory).toBe("9500");
  });

  it("rejects invalid market values", async () => {
    const response = await putMarket(
      new Request("http://localhost/api/admin/market", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyPricePerGram: "-1",
          sellPricePerGram: "240000",
          silverInventory: "9500",
        }),
      }),
    );
    expect(response.status).toBe(400);
  });
});
