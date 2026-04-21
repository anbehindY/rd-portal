"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 text-sm text-zinc-600">
      <span className="hidden sm:inline tabular-nums">
        {total === 0
          ? "No results"
          : `Showing ${from}–${to} of ${total}`}
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className={cn(
            "inline-flex items-center justify-center h-9 w-9 rounded-lg border border-zinc-200 bg-white transition-colors",
            "hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white",
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        <span className="tabular-nums text-zinc-700">
          Page {page} <span className="text-zinc-400">of {totalPages}</span>
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className={cn(
            "inline-flex items-center justify-center h-9 w-9 rounded-lg border border-zinc-200 bg-white transition-colors",
            "hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white",
          )}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
