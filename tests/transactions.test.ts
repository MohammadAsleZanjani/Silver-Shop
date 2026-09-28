import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ErrorCode } from "@/lib/errors";
import { Decimal } from "@/lib/decimal";
import { buySilver } from "@/services/order.service";
import { GET as listTransactions } from "@/app/api/transactions/route";
import { GET as getTransaction } from "@/app/api/transactions/[id]/route";
import { GET as unknownApi } from "@/app/api/[...notFound]/route";
import { newKey, resetDb } from "./helpers";

describe("transactions api", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns an empty list", async () => {
    const response = await listTransactions(
      new Request("http://localhost/api/transactions?page=1&limit=10"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it("paginates newest first", async () => {
    await buySilver(new Decimal("1000000"), newKey());
    await buySilver(new Decimal("2000000"), newKey());
    await buySilver(new Decimal("3000000"), newKey());

    const page1 = await listTransactions(
      new Request("http://localhost/api/transactions?page=1&limit=2"),
    );
    const body1 = await page1.json();
    expect(body1.data).toHaveLength(2);
    expect(body1.pagination.total).toBe(3);
    expect(body1.pagination.totalPages).toBe(2);
    expect(body1.data[0].totalAmount).toBe("3000000");

    const page2 = await listTransactions(
      new Request("http://localhost/api/transactions?page=2&limit=2"),
    );
    const body2 = await page2.json();
    expect(body2.data).toHaveLength(1);
    expect(body2.data[0].totalAmount).toBe("1000000");
  });

  it("returns transaction detail and 404 when missing", async () => {
    const created = await buySilver(new Decimal("1000000"), newKey());
    const row = await prisma.transaction.findFirstOrThrow();

    const found = await getTransaction(new Request(`http://localhost/api/transactions/${row.id}`), {
      params: Promise.resolve({ id: row.id }),
    });
    expect(found.status).toBe(200);
    const foundBody = await found.json();
    expect(foundBody.data.id).toBe(row.id);
    expect(foundBody.data.pricePerGram).toBe(created.order.pricePerGram);

    const missing = await getTransaction(
      new Request("http://localhost/api/transactions/does-not-exist"),
      { params: Promise.resolve({ id: "does-not-exist" }) },
    );
    expect(missing.status).toBe(404);
    const missingBody = await missing.json();
    expect(missingBody.error.code).toBe(ErrorCode.TRANSACTION_NOT_FOUND);
  });

  it("rejects invalid page and limit", async () => {
    const invalidPage = await listTransactions(
      new Request("http://localhost/api/transactions?page=0"),
    );
    expect(invalidPage.status).toBe(400);

    const invalidLimit = await listTransactions(
      new Request("http://localhost/api/transactions?limit=101"),
    );
    expect(invalidLimit.status).toBe(400);
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const response = await unknownApi();
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});
