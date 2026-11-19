import React from "react";
import { cn } from "@/lib/utils";

export type ButtonStyle = "primary" | "secondary" | "outline" | "ghost";
export type ButtonScale = "sm" | "md" | "lg";

const STYLE_MAP: Record<ButtonStyle, string> = {
  primary:
    "bg-azzurro-navy text-white hover:bg-azzurro-ocean shadow-sm border border-transparent",
  secondary:
    "bg-azzurro-sky text-azzurro-navy hover:bg-slate-200/80 border border-slate-200",
  outline:
    "bg-white text-azzurro-navy border border-slate-200 hover:bg-slate-50",
  ghost: "bg-transparent text-azzurro-navy hover:bg-slate-100",
};

const SCALE_MAP: Record<ButtonScale, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-11 px-6 text-sm rounded-lg",
};

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonStyle;
  size?: ButtonScale;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        STYLE_MAP[variant],
        SCALE_MAP[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
