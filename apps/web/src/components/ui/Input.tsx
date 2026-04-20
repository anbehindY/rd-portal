import { forwardRef, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leadingIcon?: LucideIcon;
  error?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon: LeadingIcon, error, disabled, ...props },
  ref,
) {
  return (
    <div className="relative">
      {LeadingIcon && (
        <LeadingIcon
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            error ? "text-red-500" : "text-zinc-400",
          )}
        />
      )}
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          "w-full rounded-xl border bg-[#fbfaf9] px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 transition-colors",
          LeadingIcon && "pl-10",
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-600"
            : "border-[#E9E6E299] focus:border-zinc-900 focus:ring-zinc-900",
          disabled && "opacity-60 cursor-not-allowed",
          className,
        )}
        {...props}
      />
    </div>
  );
});

export default Input;
