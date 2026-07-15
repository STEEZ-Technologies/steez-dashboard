"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

export function RangeTabs({
  current,
  basePath = "/analytics",
}: {
  current: string;
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

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
