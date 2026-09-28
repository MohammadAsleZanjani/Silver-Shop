import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-zinc-500">۴۰۴</p>
      <h1 className="mt-2 text-2xl font-semibold">صفحه پیدا نشد</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        مسیر درخواستی وجود ندارد. به داشبورد برگردید و معامله را از آنجا ادامه دهید.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        بازگشت به داشبورد
      </Link>
    </div>
  );
}
