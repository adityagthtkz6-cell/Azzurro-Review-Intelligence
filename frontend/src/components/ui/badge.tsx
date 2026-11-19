import React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "navy"
  | "positive"
  | "neutral"
  | "negative"
  | "sample"
  | "outline";

const TONE_STYLES: Record<BadgeTone, string> = {
  navy: "bg-azzurro-navy text-white border-transparent",
  positive: "bg-emerald-50 text-emerald-800 border-emerald-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  negative: "bg-rose-50 text-rose-800 border-rose-200",
  sample: "bg-amber-50 text-amber-900 border-amber-300",
  outline: "bg-white text-azzurro-navy border-slate-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({
  tone = "navy",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
