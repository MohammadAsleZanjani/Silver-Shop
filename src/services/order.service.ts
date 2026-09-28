import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MARKET_ID, DEFAULT_USER_ID } from "@/lib/constants";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  calculateBuyWeight,
  calculateSellAmount,
  Decimal,
  toDecimal,
} from "@/lib/decimal";
import { isPriceAvailable, lockMarket, lockUser } from "@/services/market.service";
import {
  BalanceDto,
  OrderDto,
  serializeMoney,
  serializeWeight,
  toOrderTypeDto,
} from "@/lib/types";

const TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  maxWait: 10_000,
  timeout: 15_000,
} as const;

type OrderRecord = {
  id: string;
  type: "BUY" | "SELL";
  inputAmount: Prisma.Decimal | null;
  inputWeight: Prisma.Decimal | null;
  weight: Prisma.Decimal;
  pricePerGram: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  createdAt: Date;
};

type UserRecord = {
  cashBalance: Prisma.Decimal;
  silverBalance: Prisma.Decimal;
};

export type OrderOperationResult = {
  order: OrderDto;
  balance: BalanceDto;
};

export async function buySilver(amount: Decimal, idempotencyKey: string): Promise<OrderOperationResult> {
  if (!amount.isFinite() || amount.lte(0)) {
    throw new AppError(ErrorCode.INVALID_AMOUNT, "Amount must be greater than zero.", 400, {
      amount: "Amount must be greater than zero.",
    });
  }

  return runWithRetry(idempotencyKey, "BUY", amount, () =>
    prisma.$transaction(async (tx) => {
      await lockUser(tx, DEFAULT_USER_ID);
      await lockMarket(tx);

      const existing = await tx.order.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        assertMatchingBuyPayload(existing, amount);
        const user = await requireUser(tx);
        return toResult(existing, user);
      }

      const user = await requireUser(tx);
      const market = await requireMarket(tx, "buy");

      if (!isPriceAvailable(market.buyPricePerGram)) {
        throw new AppError(
          ErrorCode.PRICE_UNAVAILABLE,
          "Buy price is currently unavailable.",
          503,
        );
      }

      const price = toDecimal(market.buyPricePerGram);
      const weight = calculateBuyWeight(amount, price);

      if (weight.lte(0)) {
        throw new AppError(ErrorCode.INVALID_AMOUNT, "Amount must be greater than zero.", 400, {
          amount: "Amount must be greater than zero.",
        });
      }

      const cash = toDecimal(user.cashBalance);
      const inventory = toDecimal(market.silverInventory);

      if (cash.lt(amount)) {
        throw new AppError(
          ErrorCode.INSUFFICIENT_CASH_BALANCE,
          "Insufficient cash balance.",
          409,
        );
      }

      if (inventory.lt(weight)) {
        throw new AppError(
          ErrorCode.INSUFFICIENT_MARKET_SILVER,
          "Insufficient silver inventory.",
          409,
        );
      }

      const nextCash = cash.minus(amount);
      const nextSilver = toDecimal(user.silverBalance).plus(weight);
      const nextInventory = inventory.minus(weight);

      const updatedUser = await tx.user.update({
        where: { id: DEFAULT_USER_ID },
        data: {
          cashBalance: nextCash.toFixed(),
          silverBalance: nextSilver.toFixed(),
        },
      });

      await tx.market.update({
        where: { id: DEFAULT_MARKET_ID },
        data: {
          silverInventory: nextInventory.toFixed(),
        },
      });

      const order = await tx.order.create({
        data: {
          idempotencyKey,
          userId: DEFAULT_USER_ID,
          type: "BUY",
          inputAmount: amount.toFixed(),
          inputWeight: null,
          weight: weight.toFixed(),
          pricePerGram: price.toFixed(),
          totalAmount: amount.toFixed(),
        },
      });

      await tx.transaction.create({
        data: {
          userId: DEFAULT_USER_ID,
          type: "BUY",
          weight: weight.toFixed(),
          pricePerGram: price.toFixed(),
          totalAmount: amount.toFixed(),
        },
      });

      return toResult(order, updatedUser);
    }, TRANSACTION_OPTIONS),
  );
}

export async function sellSilver(weight: Decimal, idempotencyKey: string): Promise<OrderOperationResult> {
  if (!weight.isFinite() || weight.lte(0)) {
    throw new AppError(ErrorCode.INVALID_WEIGHT, "Weight must be greater than zero.", 400, {
      weight: "Weight must be greater than zero.",
    });
  }

  return runWithRetry(idempotencyKey, "SELL", weight, () =>
    prisma.$transaction(async (tx) => {
      await lockUser(tx, DEFAULT_USER_ID);
      await lockMarket(tx);

      const existing = await tx.order.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        assertMatchingSellPayload(existing, weight);
        const user = await requireUser(tx);
        return toResult(existing, user);
      }

      const user = await requireUser(tx);
      const market = await requireMarket(tx, "sell");

      if (!isPriceAvailable(market.sellPricePerGram)) {
        throw new AppError(
          ErrorCode.PRICE_UNAVAILABLE,
          "Sell price is currently unavailable.",
          503,
        );
      }

      const price = toDecimal(market.sellPricePerGram);
      const totalAmount = calculateSellAmount(weight, price);
      const silver = toDecimal(user.silverBalance);

      if (silver.lt(weight)) {
        throw new AppError(
          ErrorCode.INSUFFICIENT_SILVER_BALANCE,
          "Insufficient silver balance.",
          409,
        );
      }

      const nextSilver = silver.minus(weight);
      const nextCash = toDecimal(user.cashBalance).plus(totalAmount);
      const nextInventory = toDecimal(market.silverInventory).plus(weight);

      const updatedUser = await tx.user.update({
        where: { id: DEFAULT_USER_ID },
        data: {
          cashBalance: nextCash.toFixed(),
          silverBalance: nextSilver.toFixed(),
        },
      });

      await tx.market.update({
        where: { id: DEFAULT_MARKET_ID },
        data: {
          silverInventory: nextInventory.toFixed(),
        },
      });

      const order = await tx.order.create({
        data: {
          idempotencyKey,
          userId: DEFAULT_USER_ID,
          type: "SELL",
          inputAmount: null,
          inputWeight: weight.toFixed(),
          weight: weight.toFixed(),
          pricePerGram: price.toFixed(),
          totalAmount: totalAmount.toFixed(),
        },
      });

      await tx.transaction.create({
        data: {
          userId: DEFAULT_USER_ID,
          type: "SELL",
          weight: weight.toFixed(),
          pricePerGram: price.toFixed(),
          totalAmount: totalAmount.toFixed(),
        },
      });

      return toResult(order, updatedUser);
    }, TRANSACTION_OPTIONS),
  );
}

async function requireUser(tx: Prisma.TransactionClient): Promise<UserRecord> {
  const user = await tx.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, "User not found.", 404);
  }

  return user;
}

async function requireMarket(tx: Prisma.TransactionClient, kind: "buy" | "sell") {
  const market = await tx.market.findUnique({
    where: { id: DEFAULT_MARKET_ID },
  });

  if (!market) {
    throw new AppError(
      ErrorCode.PRICE_UNAVAILABLE,
      kind === "buy" ? "Buy price is currently unavailable." : "Sell price is currently unavailable.",
      503,
    );
  }

  return market;
}

function assertMatchingBuyPayload(existing: OrderRecord, amount: Decimal) {
  if (existing.type !== "BUY" || !existing.inputAmount || !toDecimal(existing.inputAmount).eq(amount)) {
    throw new AppError(
      ErrorCode.IDEMPOTENCY_KEY_REUSED,
      "Idempotency key was already used with a different request.",
      409,
    );
  }
}

function assertMatchingSellPayload(existing: OrderRecord, weight: Decimal) {
  if (existing.type !== "SELL" || !existing.inputWeight || !toDecimal(existing.inputWeight).eq(weight)) {
    throw new AppError(
      ErrorCode.IDEMPOTENCY_KEY_REUSED,
      "Idempotency key was already used with a different request.",
      409,
    );
  }
}

function toResult(order: OrderRecord, user: UserRecord): OrderOperationResult {
  const dto: OrderDto = {
    id: order.id,
    type: toOrderTypeDto(order.type),
    weight: serializeWeight(order.weight),
    pricePerGram: serializeMoney(order.pricePerGram),
    totalAmount: serializeMoney(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
  };

  return {
    order: dto,
    balance: {
      cash: serializeMoney(user.cashBalance),
      silver: serializeWeight(user.silverBalance),
    },
  };
}

function isRetryablePrismaError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2034" || error.code === "P2028";
  }

  return false;
}

async function runWithRetry(
  idempotencyKey: string,
  type: "BUY" | "SELL",
  payload: Decimal,
  operation: () => Promise<OrderOperationResult>,
  attempts = 3,
): Promise<OrderOperationResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const recovered = await recoverDuplicateOrder(idempotencyKey, type, payload);
        if (recovered) {
          return recovered;
        }
      }

      lastError = error;
      if (!isRetryablePrismaError(error) || attempt === attempts) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function recoverDuplicateOrder(
  idempotencyKey: string,
  type: "BUY" | "SELL",
  payload: Decimal,
): Promise<OrderOperationResult | null> {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey },
  });

  if (!existing) {
    return null;
  }

  if (type === "BUY") {
    assertMatchingBuyPayload(existing, payload);
  } else {
    assertMatchingSellPayload(existing, payload);
  }

  const user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, "User not found.", 404);
  }

  return toResult(existing, user);
}
