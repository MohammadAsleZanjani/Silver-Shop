import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "default-user";
const DEFAULT_MARKET_ID = process.env.DEFAULT_MARKET_ID ?? "default-market";

async function main() {
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {
      cashBalance: "100000000",
      silverBalance: "100",
    },
    create: {
      id: DEFAULT_USER_ID,
      cashBalance: "100000000",
      silverBalance: "100",
    },
  });

  await prisma.market.upsert({
    where: { id: DEFAULT_MARKET_ID },
    update: {
      buyPricePerGram: "250000",
      sellPricePerGram: "230000",
      silverInventory: "10000",
    },
    create: {
      id: DEFAULT_MARKET_ID,
      buyPricePerGram: "250000",
      sellPricePerGram: "230000",
      silverInventory: "10000",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
