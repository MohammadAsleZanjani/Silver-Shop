"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatGram, formatToman } from "@/lib/format";
import type { PaginationDto, TransactionDto } from "@/lib/types";

export function TransactionHistory({
  items,
  pagination,
  loading,
  onPageChange,
}: {
  items: TransactionDto[];
  pagination: PaginationDto;
  loading?: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>آخرین معاملات</CardTitle>
        <CardDescription>تاریخچه خرید و فروش با قیمت ثبت‌شده همان لحظه</CardDescription>
      </CardHeader>
      {loading ? (
        <p className="text-sm text-zinc-500">در حال بارگذاری معاملات...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
          هنوز معامله‌ای ثبت نشده است.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead className="text-xs text-zinc-500">
                <tr className="border-b border-zinc-200">
                  <th className="py-2 font-medium">نوع</th>
                  <th className="py-2 font-medium">وزن</th>
                  <th className="py-2 font-medium">قیمت هر گرم</th>
                  <th className="py-2 font-medium">مبلغ کل</th>
                  <th className="py-2 font-medium">زمان</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                    <td className="py-3">
                      <Badge tone={item.type === "buy" ? "buy" : "sell"}>
                        {item.type === "buy" ? "خرید" : "فروش"}
                      </Badge>
                    </td>
                    <td className="py-3">{formatGram(item.weight)}</td>
                    <td className="py-3">{formatToman(item.pricePerGram)}</td>
                    <td className="py-3">{formatToman(item.totalAmount)}</td>
                    <td className="py-3 text-zinc-500">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <Badge tone={item.type === "buy" ? "buy" : "sell"}>
                    {item.type === "buy" ? "خرید" : "فروش"}
                  </Badge>
                  <span className="text-xs text-zinc-500">{formatDateTime(item.createdAt)}</span>
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">وزن</dt>
                    <dd>{formatGram(item.weight)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">قیمت هر گرم</dt>
                    <dd>{formatToman(item.pricePerGram)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-500">مبلغ کل</dt>
                    <dd>{formatToman(item.totalAmount)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              قبلی
            </Button>
            <p className="text-xs text-zinc-500">
              صفحه {pagination.page} از {Math.max(pagination.totalPages, 1)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              بعدی
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
