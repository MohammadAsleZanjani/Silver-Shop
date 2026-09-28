import { ErrorCode } from "@/lib/errors";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/response";
import { gtaApplySchema, parseNonNegativeWeight } from "@/lib/validations";
import { applyGtaQuoteToMarket, fetchGtaQuote } from "@/services/gta-silver.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quote = await fetchGtaQuote();
    return jsonSuccess({ data: quote.dto });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await readJson(request);
    const parsed = gtaApplySchema.safeParse(json);

    if (!parsed.success) {
      return jsonError(ErrorCode.VALIDATION_ERROR, "Invalid request.", 400, {
        market: "silverInventory must be a non-negative number when provided.",
      });
    }

    const silverInventory =
      parsed.data.silverInventory === undefined
        ? undefined
        : parseNonNegativeWeight(parsed.data.silverInventory, "silverInventory");

    const result = await applyGtaQuoteToMarket(silverInventory);
    return jsonSuccess({ data: result.market, quote: result.quote });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    if (!text.trim()) {
      return {};
    }
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}
