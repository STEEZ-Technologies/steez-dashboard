export function BarList({
  items,
  emptyLabel = "No data yet.",
}: {
  items: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="relative">
          <div className="flex items-center justify-between gap-3 px-2.5 py-1.5">
            <span className="z-10 truncate text-sm font-medium">{item.label}</span>
            <span className="z-10 text-sm tabular-nums text-muted-foreground">
              {item.count.toLocaleString()}
            </span>
          </div>
          <div
            className="absolute inset-y-0 left-0 rounded-md bg-[color-mix(in_oklch,var(--chart-2),transparent_84%)]"
            style={{ width: `${(item.count / max) * 100}%` }}
          />
        </li>
      ))}
    </ul>
  );
}
