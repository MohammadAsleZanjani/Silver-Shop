import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ErrorCode, isAppError } from "@/lib/errors";

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};

export type ApiSuccessBody<T> = { success: true } & T;

export function jsonSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      success: false,
      error: details ? { code, message, details } : { code, message },
    },
    { status },
  );
}

export function handleRouteError(error: unknown): NextResponse<ApiErrorBody> {
  if (isAppError(error)) {
    return jsonError(error.code, error.message, error.status, error.details);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return jsonError(ErrorCode.NOT_FOUND, "Resource not found.", 404);
    }
  }

  console.error("Unhandled API error:", error);

  return jsonError(
    ErrorCode.INTERNAL_SERVER_ERROR,
    "Something went wrong.",
    500,
  );
}
