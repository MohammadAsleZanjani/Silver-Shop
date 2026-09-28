import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "buy" | "sell" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "buy" && "bg-emerald-50 text-emerald-800",
        tone === "sell" && "bg-rose-50 text-rose-800",
        tone === "neutral" && "bg-zinc-100 text-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
