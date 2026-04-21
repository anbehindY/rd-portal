// Browser fetch helpers for the admin portal.
// Same pattern as components/landing/DemoForm.tsx: native fetch, same-origin
// (NEXT_PUBLIC_API_URL only used outside the deployed monolith).

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export type Lead = {
  id: string;
  name: string;
  businessEmail: string;
  country: string;
  message: string | null;
  createdAt: string;
};

export type LeadListResponse = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
};

export type LeadStats = {
  total: number;
  today: number;
  last7d: number;
  last30d: number;
  perDay: { date: string; count: number }[];
  topCountries: { country: string; count: number }[];
};

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function getLeads(
  params: { page?: number; pageSize?: number; q?: string },
  signal?: AbortSignal,
): Promise<LeadListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.q) qs.set("q", params.q);
  const query = qs.toString();
  return getJson<LeadListResponse>(
    `/api/leads${query ? `?${query}` : ""}`,
    signal,
  );
}

export function getStats(signal?: AbortSignal): Promise<LeadStats> {
  return getJson<LeadStats>("/api/leads/stats", signal);
}
