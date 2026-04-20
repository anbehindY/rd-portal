// Minimal className joiner. Filters out falsy values and joins with spaces.
// Good enough for our small component library without pulling in clsx/tailwind-merge.

export type ClassValue = string | false | undefined | null;

export function cn(...args: ClassValue[]): string {
  return args.filter(Boolean).join(" ");
}
