"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/lib/i18n/provider";

/** 🇦🇪 from "AE" — regional-indicator letters. Empty for anything that isn't
 *  a two-letter code. */
export function flagOf(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** A country code shown as "🇦🇪 AE"; hovering (desktop) or tapping (phone)
 *  pops up the flag and the full country name in the dashboard's language. */
export function CountryCode({ code, className }: { code: string; className?: string }) {
  const { locale } = useT();
  let name = code;
  try {
    name = new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    // Not a region code the runtime knows — show it as-is.
  }
  const flag = flagOf(code);

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        onClick={(e) => e.stopPropagation()}
        className={
          "inline-flex cursor-default items-center gap-1 rounded-sm underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 " +
          (className ?? "")
        }
        aria-label={name}
      >
        {flag && <span aria-hidden>{flag}</span>}
        {code.toUpperCase()}
      </PopoverTrigger>
      <PopoverContent className="w-auto flex-row items-center gap-2 px-3 py-2 text-sm">
        {flag && <span className="text-xl leading-none">{flag}</span>}
        <span className="font-medium">{name}</span>
      </PopoverContent>
    </Popover>
  );
}
