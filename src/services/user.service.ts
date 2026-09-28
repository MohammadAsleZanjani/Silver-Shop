import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { AppError, ErrorCode } from "@/lib/errors";
import { serializeMoney, serializeWeight, UserDto } from "@/lib/types";

export async function getCurrentUser(): Promise<UserDto> {
  const user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, "User not found.", 404);
  }

  return {
    cashBalance: serializeMoney(user.cashBalance),
    silverBalance: serializeWeight(user.silverBalance),
  };
}
