import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getGtaQuote, POST as applyGtaQuote } from "@/app/api/admin/market/gta/route";
import { getMarketRow, resetDb } from "./helpers";

const livePayload = {
  price_990: 481750,
  price_925: 450120,
  mesghal: 2220000,
  troy_ounce_usd: "61.25",
  change_percent: 1.37,
  is_bullish: true,
  updated_at: "2026-09-28T15:00:01+03:30",
  updated_at_jalali: "1405/07/06 15:00",
  stale: false,
};

const goldabPayload = {
  ok: true,
  items: [
    { title: "ساچمه ایرانی", ayar: 990, buy: 2130000, sell: 2220000 },
    { title: "نقره عیار 925", ayar: 925, buy: 431000, sell: 450000 },
  ],
};

const originalFetch = global.fetch;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockGta(options: { live?: unknown; goldab?: unknown; liveStatus?: number; failLive?: boolean }) {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/silver-price/live")) {
      if (options.failLive) {
        throw new Error("network down");
      }
      return jsonResponse(options.live ?? livePayload, options.liveStatus ?? 200);
    }
    if (url.includes("/silver-price/goldab-feed")) {
      if (options.goldab === null) {
        throw new Error("goldab timeout");
      }
      return jsonResponse(options.goldab ?? goldabPayload);
    }
    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;
}

describe("admin gta market api", () => {
  beforeEach(async () => {
    await resetDb();
    mockGta({});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("previews live GTA prices without writing the market", async () => {
    const response = await getGtaQuote();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.buyPricePerGram).toBe("481750");
    expect(body.data.sellPricePerGram).toBe("462220");
    expect(body.data.spreadFromFeed).toBe(true);

    const market = await getMarketRow();
    expect(market.buyPricePerGram.toString()).toBe("250000");
  });

  it("applies GTA prices and can update inventory in the same request", async () => {
    const response = await applyGtaQuote(
      new Request("http://localhost/api/admin/market/gta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ silverInventory: "8800" }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.buyPricePerGram).toBe("481750");
    expect(body.data.sellPricePerGram).toBe("462220");
    expect(body.data.silverInventory).toBe("8800");
    expect(body.quote.source).toBe("gta");
  });

  it("keeps current inventory when applying prices from live-only data", async () => {
    mockGta({ goldab: null });
    const response = await applyGtaQuote(
      new Request("http://localhost/api/admin/market/gta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.buyPricePerGram).toBe("481750");
    expect(body.data.sellPricePerGram).toBe("481750");
    expect(body.data.silverInventory).toBe("10000");
    expect(body.quote.spreadFromFeed).toBe(false);
  });

  it("returns 503 when the live GTA endpoint is unreachable", async () => {
    mockGta({ failLive: true });
    const response = await getGtaQuote();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("EXTERNAL_PRICE_UNAVAILABLE");
  });
});
