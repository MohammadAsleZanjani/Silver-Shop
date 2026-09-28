import Link from "next/link";

export function SiteHeader({ current }: { current: "dashboard" | "admin" }) {
  return (
    <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-zinc-100">
            Ag
          </span>
          <span>
            <span className="block text-sm font-semibold text-zinc-900">Silver Shop</span>
            <span className="block text-xs text-zinc-500">پلتفرم خرید و فروش نقره</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
          <Link
            href="/dashboard"
            className={`rounded-lg px-3 py-2 text-sm ${
              current === "dashboard" ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-600"
            }`}
          >
            داشبورد
          </Link>
          <Link
            href="/admin"
            className={`rounded-lg px-3 py-2 text-sm ${
              current === "admin" ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-600"
            }`}
          >
            مدیریت
          </Link>
        </nav>
      </div>
    </header>
  );
}
