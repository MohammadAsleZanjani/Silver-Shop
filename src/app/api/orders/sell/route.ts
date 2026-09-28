import { ErrorCode } from "@/lib/errors";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/response";
import { parseIdempotencyKey, parsePositiveWeight, sellBodySchema } from "@/lib/validations";
import { sellSilver } from "@/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const idempotencyKey = parseIdempotencyKey(request.headers.get("Idempotency-Key"));
    const json = await readJson(request);
    const parsed = sellBodySchema.safeParse(json);

    if (!parsed.success) {
      return jsonError(ErrorCode.INVALID_WEIGHT, "Weight must be greater than zero.", 400, {
        weight: "Weight must be greater than zero.",
      });
    }

    const weight = parsePositiveWeight(parsed.data.weight, "weight", ErrorCode.INVALID_WEIGHT);
    const result = await sellSilver(weight, idempotencyKey);
    return jsonSuccess(result, 201);
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
