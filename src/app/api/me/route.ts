import { handleRouteError, jsonSuccess } from "@/lib/response";
import { getCurrentUser } from "@/services/user.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCurrentUser();
    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
