import { Decimal } from "decimal.js";
import { MONEY_SCALE, WEIGHT_SCALE } from "@/lib/constants";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -20,
  toExpPos: 20,
});

export { Decimal };

export function toDecimal(value: Decimal.Value): Decimal {
  return value instanceof Decimal ? value : new Decimal(value.toString());
}

export function roundMoney(value: Decimal.Value): Decimal {
  return toDecimal(value).toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

export function roundWeight(value: Decimal.Value): Decimal {
  return toDecimal(value).toDecimalPlaces(WEIGHT_SCALE, Decimal.ROUND_HALF_UP);
}

export function toApiDecimal(value: Decimal.Value): string {
  const decimal = toDecimal(value);
  if (decimal.isZero()) {
    return "0";
  }

  return decimal.toSignificantDigits(20).toString();
}

export function calculateBuyWeight(amount: Decimal.Value, pricePerGram: Decimal.Value): Decimal {
  return roundWeight(toDecimal(amount).div(toDecimal(pricePerGram)));
}

export function calculateSellAmount(weight: Decimal.Value, pricePerGram: Decimal.Value): Decimal {
  return roundMoney(toDecimal(weight).times(toDecimal(pricePerGram)));
}

export function calculateSilverAssetValue(
  silverBalance: Decimal.Value,
  sellPricePerGram: Decimal.Value,
): Decimal {
  return roundMoney(toDecimal(silverBalance).times(toDecimal(sellPricePerGram)));
}
