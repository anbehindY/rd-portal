import type { Lead } from "@/lib/api";
import { COUNTRIES } from "@/lib/countries";

type LeadsTableProps = {
  items: Lead[];
  loading?: boolean;
};

const NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.name]),
);

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function LeadsTable({ items, loading }: LeadsTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm overflow-hidden">
        <ul className="divide-y divide-zinc-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="p-4 flex gap-4">
              <div className="h-4 flex-1 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-10 animate-pulse rounded bg-zinc-100" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-10 shadow-sm text-center">
        <p className="text-sm text-zinc-500">
          No requests yet — submissions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm overflow-hidden">
      {/* Desktop table */}
      <table className="hidden sm:table w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Received</th>
            <th className="px-4 py-3 font-medium">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((lead) => (
            <tr key={lead.id} className="hover:bg-zinc-50/60 transition-colors">
              <td className="px-4 py-3 font-medium text-zinc-900">
                {lead.name}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                <a
                  href={`mailto:${lead.businessEmail}`}
                  className="hover:text-zinc-900 hover:underline"
                >
                  {lead.businessEmail}
                </a>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                <span
                  title={NAME_BY_CODE[lead.country] ?? lead.country}
                  className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700"
                >
                  {lead.country}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                {formatWhen(lead.createdAt)}
              </td>
              <td className="px-4 py-3 text-zinc-500 max-w-[28ch] truncate">
                {lead.message ?? (
                  <span className="text-zinc-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile card list */}
      <ul className="sm:hidden divide-y divide-zinc-100">
        {items.map((lead) => (
          <li key={lead.id} className="p-4 flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-zinc-900">
                  {lead.name}
                </div>
                <a
                  href={`mailto:${lead.businessEmail}`}
                  className="block truncate text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
                >
                  {lead.businessEmail}
                </a>
              </div>
              <span
                title={NAME_BY_CODE[lead.country] ?? lead.country}
                className="shrink-0 inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700"
              >
                {lead.country}
              </span>
            </div>
            {lead.message && (
              <p className="text-sm text-zinc-600 line-clamp-2">
                {lead.message}
              </p>
            )}
            <div className="text-xs text-zinc-400">
              {formatWhen(lead.createdAt)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
