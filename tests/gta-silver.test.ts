import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/decimal";
import { buildGtaQuote, findSachmeItem, tomanPerGramFromMesghal } from "@/services/gta-silver.service";

const live = {
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

describe("gta silver mapping", () => {
  it("uses live price_990 for both sides when the goldab feed is missing", () => {
    const quote = buildGtaQuote(live, undefined, new Date("2026-09-28T12:00:00.000Z"));
    expect(quote.dto.buyPricePerGram).toBe("481750");
    expect(quote.dto.sellPricePerGram).toBe("481750");
    expect(quote.dto.spreadFromFeed).toBe(false);
    expect(quote.dto.live.stale).toBe(false);
    expect(quote.dto.purity).toBe("990");
  });

  it("converts ساچمه ایرانی buy from mesghal to the shop sell price per gram", () => {
    const quote = buildGtaQuote(live, {
      title: "ساچمه ایرانی",
      ayar: 990,
      buy: 2130000,
      sell: 2220000,
    });

    expect(quote.dto.buyPricePerGram).toBe("481750");
    expect(quote.dto.sellPricePerGram).toBe("462220");
    expect(quote.dto.spreadFromFeed).toBe(true);
    expect(quote.sellPricePerGram.eq(tomanPerGramFromMesghal(2130000))).toBe(true);
  });

  it("picks the shotgun pellet row from the goldab table", () => {
    const item = findSachmeItem([
      { title: "نقره عیار 925", buy: 431000, sell: 450000 },
      { title: "ساچمه ایرانی", buy: 2130000, sell: 2220000 },
    ]);
    expect(item?.title).toBe("ساچمه ایرانی");
  });

  it("rounds mesghal prices the same way GTA shows per-gram values", () => {
    expect(tomanPerGramFromMesghal(2220000).eq(new Decimal(481750))).toBe(true);
    expect(tomanPerGramFromMesghal(2130000).eq(new Decimal(462220))).toBe(true);
  });
});
