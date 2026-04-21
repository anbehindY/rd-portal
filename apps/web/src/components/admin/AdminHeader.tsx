"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

type AdminHeaderProps = {
  onRefresh: () => void;
  refreshing?: boolean;
};

export default function AdminHeader({
  onRefresh,
  refreshing,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-zinc-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-logo text-black text-2xl sm:text-3xl tracking-[0.01em]">
            Sport News
          </span>
          <span className="hidden sm:inline text-sm text-zinc-400">·</span>
          <span className="hidden sm:inline text-sm font-medium text-zinc-600">
            Admin · Demo Requests
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors",
              "hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
              aria-hidden
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
