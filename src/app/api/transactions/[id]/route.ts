import { handleRouteError, jsonSuccess } from "@/lib/response";
import { getTransactionById } from "@/services/transaction.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await getTransactionById(id);
    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
