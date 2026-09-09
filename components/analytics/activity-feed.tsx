"use client";

import { Eye, MousePointerClick, FileText } from "lucide-react";
import type { ActivityItem } from "@/lib/analytics";
import { useT } from "@/lib/i18n/provider";

function timeAgo(date: Date): string {
  // Clamp at 0: a row timestamped slightly ahead of the client clock (server
  // vs browser skew) would otherwise render as "-28623s ago".
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// The public site's raw URLs mean nothing to a non-technical owner, so "/"
// and "/category/rectangle-panels/" read as "Home page" and
// "Category · Rectangle panels".
function humanizePath(
  path: string,
  labels: { home: string; category: string; product: string },
): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return labels.home;

  const titleize = (s: string) =>
    s.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());

  const [first, ...rest] = segments;
  const prefix =
    first === "category" || first === "categories"
      ? labels.category
      : first === "product" || first === "products"
        ? labels.product
        : null;

  if (prefix && rest.length > 0) return `${prefix} · ${titleize(rest.join(" "))}`;
  return titleize(segments[segments.length - 1]);
}

const ICON = {
  page_view: FileText,
  product_view: Eye,
  product_click: MousePointerClick,
} as const;

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const { dict } = useT();
  const LABEL = {
    page_view: dict.overview.pageViewed,
    product_view: dict.overview.productViewed,
    product_click: dict.overview.productClicked,
  } as const;
  const pathLabels = {
    home: dict.overview.pathHome,
    category: dict.overview.pathCategory,
    product: dict.overview.pathProduct,
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const Icon = ICON[item.kind];
        // Only page views carry a URL as their detail; the product kinds
        // already carry a product name.
        const detail =
          item.kind === "page_view" && item.detail
            ? humanizePath(item.detail, pathLabels)
            : item.detail;
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{LABEL[item.kind]}</p>
              {detail && (
                <p className="truncate text-xs text-muted-foreground">
                  {detail}
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
