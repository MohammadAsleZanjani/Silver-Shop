import { apiFetch } from "@/lib/api/client";
import type { UserDto } from "@/lib/types";

export async function fetchMe() {
  const result = await apiFetch<{ data: UserDto }>("/api/me");
  return result.data;
}
