import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MARKET_ID } from "@/lib/constants";
import { AppError, ErrorCode } from "@/lib/errors";
import { Decimal, toDecimal } from "@/lib/decimal";
import { MarketDto, serializeMoney, serializeWeight } from "@/lib/types";

export async function getMarket(): Promise<MarketDto> {
  const market = await prisma.market.findUnique({
    where: { id: DEFAULT_MARKET_ID },
  });

  if (!market) {
    throw new AppError(ErrorCode.PRICE_UNAVAILABLE, "Buy price is currently unavailable.", 503);
  }

  return toMarketDto(market);
}

export async function updateMarket(input: {
  buyPricePerGram: Decimal;
  sellPricePerGram: Decimal;
  silverInventory: Decimal;
}): Promise<MarketDto> {
  const market = await prisma.$transaction(async (tx) => {
    await lockMarket(tx);

    return tx.market.update({
      where: { id: DEFAULT_MARKET_ID },
      data: {
        buyPricePerGram: input.buyPricePerGram.toFixed(),
        sellPricePerGram: input.sellPricePerGram.toFixed(),
        silverInventory: input.silverInventory.toFixed(),
      },
    });
  });

  return toMarketDto(market);
}

export async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

export async function lockMarket(tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT id FROM "Market" WHERE id = ${DEFAULT_MARKET_ID} FOR UPDATE`;
}

export function toMarketDto(market: {
  buyPricePerGram: Prisma.Decimal;
  sellPricePerGram: Prisma.Decimal;
  silverInventory: Prisma.Decimal;
  updatedAt: Date;
}): MarketDto {
  return {
    buyPricePerGram: serializeMoney(market.buyPricePerGram),
    sellPricePerGram: serializeMoney(market.sellPricePerGram),
    silverInventory: serializeWeight(market.silverInventory),
    updatedAt: market.updatedAt.toISOString(),
  };
}

export function isPriceAvailable(price: Prisma.Decimal | Decimal): boolean {
  return toDecimal(price).gt(0);
}
