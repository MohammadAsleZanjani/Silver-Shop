import { ErrorCode } from "@/lib/errors";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/response";
import {
  marketUpdateSchema,
  parseNonNegativeWeight,
  parsePositiveMoney,
} from "@/lib/validations";
import { getMarket, updateMarket } from "@/services/market.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMarket();
    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const json = await readJson(request);
    const parsed = marketUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return jsonError(ErrorCode.VALIDATION_ERROR, "Invalid request.", 400, {
        market: "buyPricePerGram, sellPricePerGram and silverInventory are required.",
      });
    }

    const buyPricePerGram = parsePositiveMoney(
      parsed.data.buyPricePerGram,
      "buyPricePerGram",
      ErrorCode.VALIDATION_ERROR,
    );
    const sellPricePerGram = parsePositiveMoney(
      parsed.data.sellPricePerGram,
      "sellPricePerGram",
      ErrorCode.VALIDATION_ERROR,
    );
    const silverInventory = parseNonNegativeWeight(parsed.data.silverInventory, "silverInventory");

    const data = await updateMarket({
      buyPricePerGram,
      sellPricePerGram,
      silverInventory,
    });

    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
