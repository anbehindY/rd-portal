"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCard from "@/components/admin/StatCard";
import BarChart from "@/components/admin/BarChart";
import CountryList from "@/components/admin/CountryList";
import LeadsTable from "@/components/admin/LeadsTable";
import Pagination from "@/components/admin/Pagination";
import Input from "@/components/ui/Input";
import {
  getLeads,
  getStats,
  type LeadListResponse,
  type LeadStats,
} from "@/lib/api";

const PAGE_SIZE = 20;

export default function AdminPage() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [list, setList] = useState<LeadListResponse | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [inFlight, setInFlight] = useState(0);

  // Debounce search input — 300ms is snappy without hammering the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Reset to first page when the search term changes.
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    setPage(1);
  }, [debouncedQ]);

  // Fetches yield to the microtask queue before touching state, so the setState
  // calls aren't synchronous with the effect body that starts them.
  const fetchStats = useCallback(async (signal: AbortSignal) => {
    await Promise.resolve();
    if (signal.aborted) return;
    setInFlight((n) => n + 1);
    try {
      const s = await getStats(signal);
      setStats(s);
      setError(null);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError("Unable to load dashboard stats.");
    } finally {
      setInFlight((n) => n - 1);
    }
  }, []);

  const fetchList = useCallback(
    async (signal: AbortSignal, args: { page: number; q: string }) => {
      await Promise.resolve();
      if (signal.aborted) return;
      setInFlight((n) => n + 1);
      try {
        const l = await getLeads(
          { page: args.page, pageSize: PAGE_SIZE, q: args.q || undefined },
          signal,
        );
        setList(l);
        setError(null);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError("Unable to load requests.");
      } finally {
        setInFlight((n) => n - 1);
      }
    },
    [],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    // Data fetch triggers setState on completion; the rule guards against
    // cascading synchronous setState, which we avoid via `await Promise.resolve()`.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats(ctrl.signal);
    return () => ctrl.abort();
  }, [refreshToken, fetchStats]);

  useEffect(() => {
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchList(ctrl.signal, { page, q: debouncedQ });
    return () => ctrl.abort();
  }, [debouncedQ, page, refreshToken, fetchList]);

  const handleRefresh = useCallback(() => {
    setRefreshToken((n) => n + 1);
  }, []);

  const statsLoading = stats === null;
  const listLoading = list === null;
  const refreshing = inFlight > 0;
  const perDayValues = stats?.perDay.map((p) => p.count) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <AdminHeader onRefresh={handleRefresh} refreshing={refreshing} />

      <main className="flex-1">
        <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <section
            aria-label="Overview statistics"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <StatCard
              label="Total"
              value={stats?.total ?? 0}
              sparkline={perDayValues}
              loading={statsLoading}
            />
            <StatCard
              label="Today"
              value={stats?.today ?? 0}
              accent="emerald"
              loading={statsLoading}
            />
            <StatCard
              label="Last 7 days"
              value={stats?.last7d ?? 0}
              loading={statsLoading}
            />
            <StatCard
              label="Last 30 days"
              value={stats?.last30d ?? 0}
              loading={statsLoading}
            />
          </section>

          <section
            aria-label="Trend and country breakdown"
            className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4"
          >
            {statsLoading || !stats ? (
              <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm h-56 animate-pulse" />
            ) : (
              <BarChart data={stats.perDay} title="Requests per day" />
            )}
            {statsLoading || !stats ? (
              <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm h-56 animate-pulse" />
            ) : (
              <CountryList items={stats.topCountries} />
            )}
          </section>

          <section aria-label="Demo requests" className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900">
                All requests
              </h2>
              <div className="w-full sm:w-80">
                <Input
                  type="search"
                  placeholder="Search name, email, or country"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  leadingIcon={Search}
                  aria-label="Search requests"
                />
              </div>
            </div>

            <LeadsTable items={list?.items ?? []} loading={listLoading} />

            {list && list.total > 0 && (
              <Pagination
                page={list.page}
                pageSize={list.pageSize}
                total={list.total}
                onPageChange={(p) => setPage(p)}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
