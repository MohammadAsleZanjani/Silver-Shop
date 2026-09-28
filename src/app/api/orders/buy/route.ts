import { ErrorCode } from "@/lib/errors";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/response";
import { buyBodySchema, parseIdempotencyKey, parsePositiveMoney } from "@/lib/validations";
import { buySilver } from "@/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const idempotencyKey = parseIdempotencyKey(request.headers.get("Idempotency-Key"));
    const json = await readJson(request);
    const parsed = buyBodySchema.safeParse(json);

    if (!parsed.success) {
      return jsonError(ErrorCode.INVALID_AMOUNT, "Amount must be greater than zero.", 400, {
        amount: "Amount must be greater than zero.",
      });
    }

    const amount = parsePositiveMoney(parsed.data.amount, "amount", ErrorCode.INVALID_AMOUNT);
    const result = await buySilver(amount, idempotencyKey);
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
