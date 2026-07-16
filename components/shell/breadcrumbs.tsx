"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useT } from "@/lib/i18n/provider";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const { dict } = useT();

  const LABELS: Record<string, string> = {
    "": dict.nav.overview,
    products: dict.nav.products,
    categories: dict.nav.categories,
    analytics: dict.nav.analytics,
    team: dict.nav.team,
    settings: dict.nav.settings,
    new: dict.actions.new,
    edit: dict.actions.edit,
    finishes: "Finishes",
  };
  function label(seg: string) {
    return LABELS[seg] ?? seg;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>{dict.nav.overview}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href="/" />}>{dict.nav.overview}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const isLast = i === segments.length - 1;
          const isId = seg.length > 16 && !LABELS[seg]; // cuid-ish, skip label
          if (isId) return null;
          return (
            <Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label(seg)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {label(seg)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
