import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-[var(--bg-main)] px-3 py-2 text-base placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:border-[var(--primary-blue)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-blue-soft)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "border-[var(--card-border)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
