type BarChartProps = {
  data: { date: string; count: number }[];
  title?: string;
};

export default function BarChart({ data, title }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm">
      {title && (
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <span className="text-xs text-zinc-500">Last 30 days</span>
        </div>
      )}

      <div
        className="flex h-40 items-end gap-1"
        role="img"
        aria-label={`Requests per day for the last ${data.length} days`}
      >
        {data.map((d) => {
          const heightPct = (d.count / max) * 100;
          const label = `${formatter.format(new Date(d.date))} — ${d.count} request${d.count === 1 ? "" : "s"}`;
          return (
            <div
              key={d.date}
              className="group relative flex-1 h-full flex items-end"
              title={label}
            >
              <div className="w-full h-full rounded-sm bg-zinc-100" />
              <div
                className="absolute inset-x-0 bottom-0 rounded-sm bg-zinc-900 transition-colors group-hover:bg-emerald-500"
                style={{ height: `${Math.max(heightPct, d.count > 0 ? 6 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>

      {data.length > 0 && (
        <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
          <span>{formatter.format(new Date(data[0].date))}</span>
          <span>{formatter.format(new Date(data[data.length - 1].date))}</span>
        </div>
      )}
    </div>
  );
}
