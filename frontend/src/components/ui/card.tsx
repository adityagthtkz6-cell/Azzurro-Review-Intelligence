import React from "react";
import { cn } from "@/lib/utils";

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...rest }: BoxProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white text-azzurro-navy shadow-sm",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: BoxProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight text-azzurro-navy",
        className
      )}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-slate-500", className)} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...rest }: BoxProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: BoxProps) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...rest}>
      {children}
    </div>
  );
}
