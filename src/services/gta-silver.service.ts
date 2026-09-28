import dns from "node:dns";
import { z } from "zod";
import {
  GTA_FETCH_TIMEOUT_MS,
  GTA_MESGHAL_GRAMS,
  GTA_SACHME_TITLE,
  GTA_SILVER_GOLDAB_URL,
  GTA_SILVER_LIVE_URL,
} from "@/lib/constants";
import { Decimal, toDecimal } from "@/lib/decimal";
import { AppError, ErrorCode } from "@/lib/errors";
import { serializeMoney, type GtaQuoteDto } from "@/lib/types";
import { getMarket, updateMarket } from "@/services/market.service";

dns.setDefaultResultOrder("ipv4first");

export const gtaLiveSchema = z.object({
  price_990: z.number().positive(),
  price_925: z.number().optional(),
  mesghal: z.number().optional(),
  troy_ounce_usd: z.union([z.string(), z.number()]).optional(),
  change_percent: z.number().nullable().optional(),
  is_bullish: z.boolean().nullable().optional(),
  updated_at: z.string().optional(),
  updated_at_jalali: z.string().optional(),
  stale: z.boolean().optional(),
});

export const gtaGoldabItemSchema = z.object({
  title: z.string(),
  ayar: z.union([z.string(), z.number()]).optional(),
  buy: z.number().optional(),
  sell: z.number().optional(),
});

export const gtaGoldabSchema = z.object({
  ok: z.literal(true),
  items: z.array(gtaGoldabItemSchema),
});

export type GtaLivePayload = z.infer<typeof gtaLiveSchema>;
export type GtaGoldabItem = z.infer<typeof gtaGoldabItemSchema>;

export type MappedGtaQuote = {
  buyPricePerGram: Decimal;
  sellPricePerGram: Decimal;
  dto: GtaQuoteDto;
};

export function findSachmeItem(items: GtaGoldabItem[]): GtaGoldabItem | undefined {
  return items.find((item) => item.title.trim() === GTA_SACHME_TITLE);
}

export function tomanPerGramFromMesghal(mesghalPrice: Decimal.Value): Decimal {
  return toDecimal(mesghalPrice)
    .div(GTA_MESGHAL_GRAMS)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export function buildGtaQuote(
  live: GtaLivePayload,
  goldabItem: GtaGoldabItem | undefined,
  quoteFetchedAt = new Date(),
): MappedGtaQuote {
  const buyPricePerGram = new Decimal(live.price_990);
  let sellPricePerGram = buyPricePerGram;
  let spreadFromFeed = false;

  if (goldabItem?.buy && goldabItem.buy > 0) {
    sellPricePerGram = tomanPerGramFromMesghal(goldabItem.buy);
    spreadFromFeed = true;
  }

  if (buyPricePerGram.lte(0) || sellPricePerGram.lte(0)) {
    throw new AppError(
      ErrorCode.EXTERNAL_PRICE_UNAVAILABLE,
      "GTA returned an invalid silver price.",
      503,
    );
  }

  return {
    buyPricePerGram,
    sellPricePerGram,
    dto: {
      source: "gta",
      buyPricePerGram: serializeMoney(buyPricePerGram),
      sellPricePerGram: serializeMoney(sellPricePerGram),
      purity: "990",
      unit: "gram",
      currency: "toman",
      spreadFromFeed,
      quoteFetchedAt: quoteFetchedAt.toISOString(),
      live: {
        price_990: serializeMoney(live.price_990),
        price_925: live.price_925 ? serializeMoney(live.price_925) : null,
        mesghal: live.mesghal ? serializeMoney(live.mesghal) : null,
        troy_ounce_usd:
          live.troy_ounce_usd === undefined || live.troy_ounce_usd === null
            ? null
            : String(live.troy_ounce_usd),
        change_percent: live.change_percent ?? null,
        is_bullish: live.is_bullish ?? null,
        updated_at: live.updated_at ?? null,
        updated_at_jalali: live.updated_at_jalali ?? null,
        stale: Boolean(live.stale),
      },
    },
  };
}

export async function fetchGtaQuote(): Promise<MappedGtaQuote> {
  const [liveResult, goldabResult] = await Promise.all([
    fetchJson(GTA_SILVER_LIVE_URL, GTA_FETCH_TIMEOUT_MS),
    fetchJson(GTA_SILVER_GOLDAB_URL, GTA_FETCH_TIMEOUT_MS).catch(() => null),
  ]);

  const liveParsed = gtaLiveSchema.safeParse(liveResult);
  if (!liveParsed.success) {
    throw new AppError(
      ErrorCode.EXTERNAL_PRICE_UNAVAILABLE,
      "GTA live price payload is invalid.",
      503,
    );
  }

  const goldabParsed = goldabResult ? gtaGoldabSchema.safeParse(goldabResult) : null;
  const goldabItem =
    goldabParsed?.success === true ? findSachmeItem(goldabParsed.data.items) : undefined;

  return buildGtaQuote(liveParsed.data, goldabItem);
}

export async function applyGtaQuoteToMarket(silverInventory?: Decimal) {
  const quote = await fetchGtaQuote();
  const current = await getMarket();

  const market = await updateMarket({
    buyPricePerGram: quote.buyPricePerGram,
    sellPricePerGram: quote.sellPricePerGram,
    silverInventory: silverInventory ?? toDecimal(current.silverInventory),
  });

  return { market, quote: quote.dto };
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new AppError(
      ErrorCode.EXTERNAL_PRICE_UNAVAILABLE,
      "Could not reach the GTA silver price API.",
      503,
    );
  }

  if (!response.ok) {
    throw new AppError(
      ErrorCode.EXTERNAL_PRICE_UNAVAILABLE,
      "GTA silver price API returned an error.",
      503,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new AppError(
      ErrorCode.EXTERNAL_PRICE_UNAVAILABLE,
      "GTA silver price API returned invalid JSON.",
      503,
    );
  }
}
