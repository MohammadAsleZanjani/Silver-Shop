import { handleRouteError, jsonSuccess } from "@/lib/response";
import { parsePagination } from "@/lib/validations";
import { listTransactions } from "@/services/transaction.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const result = await listTransactions(pagination);
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
