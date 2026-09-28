import { jsonError } from "@/lib/response";
import { ErrorCode } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function notFound() {
  return jsonError(ErrorCode.NOT_FOUND, "Resource not found.", 404);
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
