import { handleRouteError, jsonSuccess } from "@/lib/response";
import { getMarket } from "@/services/market.service";

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
