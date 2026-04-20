"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  error?: boolean;
  leadingIcon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
};

const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    id,
    name,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    options,
    error,
    leadingIcon: LeadingIcon,
    disabled,
    className,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
  },
  ref,
) {
  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        ref={ref}
        id={id}
        aria-invalid={error || undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        className={cn(
          "group relative w-full rounded-xl border bg-[#fbfaf9] px-4 py-3.5 pr-10 text-[15px] text-zinc-900 text-left focus:outline-none focus:ring-1 transition-colors inline-flex items-center",
          "data-placeholder:text-zinc-400",
          LeadingIcon && "pl-10",
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-600"
            : "border-[#E9E6E299] focus:border-zinc-900 focus:ring-zinc-900",
          disabled && "opacity-60 cursor-not-allowed",
          className,
        )}
      >
        {LeadingIcon && (
          <LeadingIcon
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
              error ? "text-red-500" : "text-zinc-400",
            )}
          />
        )}
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon asChild>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-180"
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "z-50 overflow-hidden rounded-xl border border-[#E9E6E299] bg-white shadow-lg",
            "min-w-(--radix-select-trigger-width) max-h-[min(18rem,var(--radix-select-content-available-height))]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        >
          <RadixSelect.Viewport className="p-1.5">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  "relative flex items-center rounded-lg px-3 py-2 pr-9 text-[15px] text-zinc-900 cursor-pointer select-none outline-none",
                  "data-highlighted:bg-zinc-100 data-[state=checked]:font-medium",
                  "data-disabled:opacity-50 data-disabled:cursor-not-allowed",
                )}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-3 inline-flex items-center">
                  <Check aria-hidden className="h-4 w-4 text-zinc-900" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});

export default Select;
