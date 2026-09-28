import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  PaginationDto,
  serializeMoney,
  serializeWeight,
  toOrderTypeDto,
  TransactionDto,
} from "@/lib/types";

export async function listTransactions(options: {
  page: number;
  limit: number;
}): Promise<{ data: TransactionDto[]; pagination: PaginationDto }> {
  const skip = (options.page - 1) * options.limit;

  const [rows, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "desc" },
      skip,
      take: options.limit,
    }),
    prisma.transaction.count({
      where: { userId: DEFAULT_USER_ID },
    }),
  ]);

  return {
    data: rows.map(toTransactionDto),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / options.limit),
    },
  };
}

export async function listAdminTransactions(options: {
  page: number;
  limit: number;
}): Promise<{ data: TransactionDto[]; pagination: PaginationDto }> {
  const skip = (options.page - 1) * options.limit;

  const [rows, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: options.limit,
    }),
    prisma.transaction.count(),
  ]);

  return {
    data: rows.map(toTransactionDto),
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / options.limit),
    },
  };
}

export async function getTransactionById(id: string): Promise<TransactionDto> {
  const row = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!row) {
    throw new AppError(ErrorCode.TRANSACTION_NOT_FOUND, "Transaction not found.", 404);
  }

  return toTransactionDto(row);
}

function toTransactionDto(row: {
  id: string;
  type: "BUY" | "SELL";
  weight: { toString(): string };
  pricePerGram: { toString(): string };
  totalAmount: { toString(): string };
  createdAt: Date;
}): TransactionDto {
  return {
    id: row.id,
    type: toOrderTypeDto(row.type),
    weight: serializeWeight(row.weight.toString()),
    pricePerGram: serializeMoney(row.pricePerGram.toString()),
    totalAmount: serializeMoney(row.totalAmount.toString()),
    createdAt: row.createdAt.toISOString(),
  };
}
