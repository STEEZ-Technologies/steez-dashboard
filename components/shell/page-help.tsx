"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HelpSectionView } from "@/components/help/help-section";
import { topicForPath } from "@/lib/help/manual";
import { useT } from "@/lib/i18n/provider";

/** The (i) beside a page title: opens that page's manual topic in a side
    panel. Tap, not hover, so it works the same on a phone. Draws nothing on
    a page the manual doesn't cover. */
export function PageHelp() {
  const pathname = usePathname();
  const { dict, locale } = useT();
  const t = dict.manual;
  const topic = topicForPath(pathname);
  // Focus lands on the panel's heading, not its last link, so it opens at the top.
  const top = useRef<HTMLDivElement>(null);
  if (!topic || pathname === "/help") return null;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground hover:text-foreground"
            aria-label={t.pageHelp}
            title={t.pageHelp}
          />
        }
      >
        <Info className="size-[18px]" />
      </SheetTrigger>
      <SheetContent
        side="right"
        initialFocus={top}
        className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader ref={top} tabIndex={-1} className="border-b pb-4 pr-12 outline-none">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t.pageHelp}</p>
          <SheetTitle className="text-lg">{topic.title[locale]}</SheetTitle>
          <SheetDescription className="leading-relaxed">{topic.summary[locale]}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 p-4">
          {topic.sections.map((s, i) => (
            <HelpSectionView key={i} section={s} locale={locale} labels={t} compact />
          ))}
          <Link
            href={`/help#${topic.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
          >
            <BookOpenText className="size-4" /> {t.openManual}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
