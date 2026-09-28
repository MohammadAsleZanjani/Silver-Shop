import { prisma } from "@/lib/prisma";
import { Decimal } from "@/lib/decimal";
import { DEFAULT_MARKET_ID, DEFAULT_USER_ID } from "@/lib/constants";

export async function resetDb(overrides?: {
  cashBalance?: string;
  silverBalance?: string;
  buyPricePerGram?: string;
  sellPricePerGram?: string;
  silverInventory?: string;
}) {
  await prisma.transaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.market.deleteMany();

  await prisma.user.create({
    data: {
      id: DEFAULT_USER_ID,
      cashBalance: overrides?.cashBalance ?? "100000000",
      silverBalance: overrides?.silverBalance ?? "100",
    },
  });

  await prisma.market.create({
    data: {
      id: DEFAULT_MARKET_ID,
      buyPricePerGram: overrides?.buyPricePerGram ?? "250000",
      sellPricePerGram: overrides?.sellPricePerGram ?? "230000",
      silverInventory: overrides?.silverInventory ?? "10000",
    },
  });
}

export async function getUser() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: DEFAULT_USER_ID },
  });
  return user;
}

export async function getMarketRow() {
  return prisma.market.findUniqueOrThrow({
    where: { id: DEFAULT_MARKET_ID },
  });
}

export function eqDecimal(actual: { toString(): string } | string, expected: string) {
  return new Decimal(actual.toString()).eq(expected);
}

export function newKey() {
  return crypto.randomUUID();
}
