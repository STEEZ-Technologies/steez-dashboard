"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A small ⓘ beside a metric's name that explains it. Opens on hover on a
 *  desktop and on tap on a phone, which has no hover. */
export function InfoTip({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        aria-label={label}
        className={cn(
          "inline-flex shrink-0 cursor-help items-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none",
          className,
        )}
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 p-3 text-xs leading-relaxed">
        {text}
      </PopoverContent>
    </Popover>
  );
}

/** A card title with its explanation tip. */
export function MetricTitle({ title, info }: { title: string; info: string }) {
  return (
    <CardTitle className="flex items-center gap-1.5">
      {title}
      <InfoTip text={info} label={title} />
    </CardTitle>
  );
}
