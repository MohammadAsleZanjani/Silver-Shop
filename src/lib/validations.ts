import { z } from "zod";
import { Decimal } from "@/lib/decimal";
import { AppError, ErrorCode } from "@/lib/errors";
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT, MONEY_SCALE, WEIGHT_SCALE } from "@/lib/constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

export const buyBodySchema = z.object({
  amount: z.union([z.string(), z.number()]),
});

export const sellBodySchema = z.object({
  weight: z.union([z.string(), z.number()]),
});

export const marketUpdateSchema = z.object({
  buyPricePerGram: z.union([z.string(), z.number()]),
  sellPricePerGram: z.union([z.string(), z.number()]),
  silverInventory: z.union([z.string(), z.number()]),
});

export const gtaApplySchema = z.object({
  silverInventory: z.union([z.string(), z.number()]).optional(),
});

export function parseIdempotencyKey(value: string | null): string {
  if (!value || !UUID_PATTERN.test(value.trim())) {
    throw new AppError(
      ErrorCode.INVALID_IDEMPOTENCY_KEY,
      "A valid UUID Idempotency-Key header is required.",
      400,
    );
  }

  return value.trim().toLowerCase();
}

export function parsePositiveMoney(value: unknown, field: string, invalidCode: ErrorCode): Decimal {
  return parseDecimal(value, {
    field,
    maxDecimals: MONEY_SCALE,
    minExclusive: "0",
    invalidCode,
    invalidMessage: `${field} must be greater than zero.`,
  });
}

export function parsePositiveWeight(value: unknown, field: string, invalidCode: ErrorCode): Decimal {
  return parseDecimal(value, {
    field,
    maxDecimals: WEIGHT_SCALE,
    minExclusive: "0",
    invalidCode,
    invalidMessage: `${field} must be greater than zero.`,
  });
}

export function parseNonNegativeWeight(value: unknown, field: string): Decimal {
  return parseDecimal(value, {
    field,
    maxDecimals: WEIGHT_SCALE,
    minInclusive: "0",
    invalidCode: ErrorCode.VALIDATION_ERROR,
    invalidMessage: `${field} must be greater than or equal to zero.`,
  });
}

export function parseDecimal(
  value: unknown,
  options: {
    field: string;
    maxDecimals: number;
    minExclusive?: string;
    minInclusive?: string;
    invalidCode: ErrorCode;
    invalidMessage: string;
  },
): Decimal {
  if (value === null || value === undefined || value === "") {
    throw fieldError(options.invalidCode, options.invalidMessage, options.field);
  }

  let raw: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw fieldError(options.invalidCode, options.invalidMessage, options.field);
    }
    raw = value.toString();
  } else if (typeof value === "string") {
    raw = value.trim();
  } else {
    throw fieldError(options.invalidCode, options.invalidMessage, options.field);
  }

  if (!DECIMAL_PATTERN.test(raw)) {
    throw fieldError(options.invalidCode, options.invalidMessage, options.field);
  }

  let decimal: Decimal;
  try {
    decimal = new Decimal(raw);
  } catch {
    throw fieldError(options.invalidCode, options.invalidMessage, options.field);
  }

  if (!decimal.isFinite()) {
    throw fieldError(options.invalidCode, options.invalidMessage, options.field);
  }

  const decimals = decimal.decimalPlaces();
  if (decimals > options.maxDecimals) {
    throw fieldError(
      options.invalidCode,
      `${options.field} can have at most ${options.maxDecimals} decimal places.`,
      options.field,
    );
  }

  if (options.minExclusive && decimal.lte(options.minExclusive)) {
    throw fieldError(options.invalidCode, options.invalidMessage, options.field);
  }

  if (options.minInclusive && decimal.lt(options.minInclusive)) {
    throw fieldError(options.invalidCode, options.invalidMessage, options.field);
  }

  return decimal;
}

export function parsePagination(searchParams: URLSearchParams): { page: number; limit: number } {
  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");

  const page = pageRaw === null || pageRaw === "" ? DEFAULT_PAGE : Number(pageRaw);
  const limit = limitRaw === null || limitRaw === "" ? DEFAULT_LIMIT : Number(limitRaw);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid pagination.", 400, {
      page: "page must be an integer greater than or equal to 1.",
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid pagination.", 400, {
      limit: `limit must be an integer between 1 and ${MAX_LIMIT}.`,
    });
  }

  return { page, limit };
}

function fieldError(code: ErrorCode, message: string, field: string): AppError {
  return new AppError(code, message, 400, { [field]: message });
}
