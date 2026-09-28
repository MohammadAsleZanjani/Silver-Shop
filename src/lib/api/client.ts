import { messageForErrorCode } from "@/lib/error-messages";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, string>;

  constructor(code: string, message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};

type ApiSuccessBody<T> = { success: true } & T;

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let body: ApiSuccessBody<T> | ApiErrorBody;
  try {
    body = (await response.json()) as ApiSuccessBody<T> | ApiErrorBody;
  } catch {
    throw new ApiRequestError(
      "INTERNAL_SERVER_ERROR",
      messageForErrorCode("INTERNAL_SERVER_ERROR"),
      response.status || 500,
    );
  }

  if (!("success" in body) || body.success === false) {
    const errorBody = body as ApiErrorBody;
    throw new ApiRequestError(
      errorBody.error?.code ?? "INTERNAL_SERVER_ERROR",
      messageForErrorCode(errorBody.error?.code, errorBody.error?.message),
      response.status,
      errorBody.error?.details,
    );
  }

  return body as T;
}
