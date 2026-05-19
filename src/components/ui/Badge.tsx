import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "accent" | "success" | "muted";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const variantClass: Record<Variant, string> = {
    default: "bg-surface-2 text-fg",
    accent: "bg-accent text-accent-fg",
    success: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    muted: "bg-surface-2 text-fg-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
