"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
  showCounter?: boolean;
  currentLength?: number;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    error,
    disabled,
    maxLength,
    showCounter,
    currentLength,
    ...props
  },
  ref,
) {
  const shouldShowCounter =
    showCounter && typeof maxLength === "number" && typeof currentLength === "number";
  const nearLimit =
    shouldShowCounter && currentLength! / maxLength! >= 0.9;

  return (
    <div className="relative">
      <textarea
        ref={ref}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={error || undefined}
        className={cn(
          "w-full rounded-xl border bg-[#fbfaf9] px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 transition-colors resize-none",
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-600"
            : "border-[#E9E6E299] focus:border-zinc-900 focus:ring-zinc-900",
          disabled && "opacity-60 cursor-not-allowed",
          shouldShowCounter && "pb-7",
          className,
        )}
        {...props}
      />
      {shouldShowCounter && (
        <span
          className={cn(
            "pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums",
            nearLimit ? "text-red-600" : "text-zinc-400",
          )}
          aria-hidden
        >
          {currentLength}/{maxLength}
        </span>
      )}
    </div>
  );
});

export default Textarea;
