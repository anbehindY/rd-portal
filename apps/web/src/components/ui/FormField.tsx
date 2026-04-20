import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export default function FormField({
  label,
  htmlFor,
  required,
  optional,
  helperText,
  error,
  children,
  className,
}: FormFieldProps) {
  const messageId = error
    ? `${htmlFor}-error`
    : helperText
      ? `${htmlFor}-helper`
      : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[15px] font-semibold text-zinc-900"
      >
        {label}
        {required && <span className="ml-1 text-zinc-900">*</span>}
        {optional && (
          <span className="ml-1 text-zinc-900 font-normal">(Optional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p
          id={messageId}
          className="text-xs text-red-600"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={messageId}
          className="text-xs text-zinc-500"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
