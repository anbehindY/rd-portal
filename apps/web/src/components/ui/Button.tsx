import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost";
type Size = "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-800 disabled:opacity-60",
  ghost:
    "bg-transparent text-zinc-800 hover:bg-zinc-100 border border-zinc-200 disabled:opacity-60",
};

const sizeStyles: Record<Size, string> = {
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-4 text-[15px] rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",
        variantStyles[variant],
        sizeStyles[size],
        isDisabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        LeadingIcon && <LeadingIcon aria-hidden className="h-4 w-4" />
      )}
      {children}
      {!loading && TrailingIcon && (
        <TrailingIcon aria-hidden className="h-4 w-4" />
      )}
    </button>
  );
});

export default Button;
