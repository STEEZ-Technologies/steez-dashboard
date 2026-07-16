"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/provider";

export function RangeTabs({
  current,
  basePath = "/analytics",
}: {
  current: string;
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { dict } = useT();
  const RANGES = [
    { value: "7", label: dict.analytics.range7 },
    { value: "30", label: dict.analytics.range30 },
    { value: "90", label: dict.analytics.range90 },
  ];

  function set(value: string) {
    const next = new URLSearchParams(params);
    next.set("range", value);
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <Tabs value={current} onValueChange={(v) => v && set(v)}>
      <TabsList>
        {RANGES.map((r) => (
          <TabsTrigger key={r.value} value={r.value}>
            {r.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
