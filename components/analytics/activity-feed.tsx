import { Eye, MousePointerClick, FileText } from "lucide-react";
import type { ActivityItem } from "@/lib/analytics";

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ICON = {
  page_view: FileText,
  product_view: Eye,
  product_click: MousePointerClick,
} as const;

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const Icon = ICON[item.kind];
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.label}</p>
              {item.detail && (
                <p className="truncate text-xs text-muted-foreground">
                  {item.detail}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {timeAgo(item.at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
