import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
  leadingIcon?: LucideIcon;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, disabled, leadingIcon: LeadingIcon, children, ...props },
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
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          "w-full appearance-none rounded-xl border bg-[#fbfaf9] px-4 py-3.5 pr-10 text-[15px] text-zinc-900 focus:outline-none focus:ring-1 transition-colors",
          "[&:has(option:checked[value=''])]:text-zinc-400",
          LeadingIcon && "pl-10",
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-600"
            : "border-[#E9E6E299] focus:border-zinc-900 focus:ring-zinc-900",
          disabled && "opacity-60 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
      />
    </div>
  );
});

export default Select;
