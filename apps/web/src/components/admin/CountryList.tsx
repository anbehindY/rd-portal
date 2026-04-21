import { COUNTRIES } from "@/lib/countries";

type CountryListProps = {
  items: { country: string; count: number }[];
};

const NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.name]),
);

export default function CountryList({ items }: CountryListProps) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Top countries</h2>
        <span className="text-xs text-zinc-500">
          {items.length === 0 ? "—" : `Top ${items.length}`}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          No countries to show yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => {
            const widthPct = (i.count / max) * 100;
            const name = NAME_BY_CODE[i.country] ?? i.country;
            return (
              <li key={i.country} className="flex items-center gap-3">
                <span className="w-10 font-mono text-xs tabular-nums text-zinc-500">
                  {i.country}
                </span>
                <span className="relative flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-zinc-900"
                    style={{ width: `${widthPct}%` }}
                  />
                </span>
                <span className="w-24 truncate text-xs text-zinc-600 text-right">
                  {name}
                </span>
                <span className="w-8 text-right text-sm font-medium tabular-nums text-zinc-900">
                  {i.count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
