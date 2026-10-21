import { Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HelpLocale, HelpSection } from "@/lib/help/manual";

/** One section of a manual topic: paragraphs, numbered steps and a note.
    Used by the /help page and the (i) panel, so both read the same. */
export function HelpSectionView({
  section,
  locale,
  labels,
  compact,
}: {
  section: HelpSection;
  locale: HelpLocale;
  labels: { tip: string; warning: string };
  compact?: boolean;
}) {
  return (
    <div className="grid gap-3">
      <h3 className={cn("font-semibold tracking-tight", compact ? "text-sm" : "text-base")}>
        {section.heading[locale]}
      </h3>
      {section.body?.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          {p[locale]}
        </p>
      ))}
      {section.steps && (
        <ol className="grid gap-2.5">
          {section.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span
                aria-hidden
                className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary tabular-nums"
              >
                {i + 1}
              </span>
              <span className="min-w-0">{s[locale]}</span>
            </li>
          ))}
        </ol>
      )}
      {section.note && (
        <div
          className={cn(
            "flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm leading-relaxed",
            section.note.kind === "tip"
              ? "border-sky-500/20 bg-sky-500/5"
              : "border-amber-500/25 bg-amber-500/5",
          )}
        >
          {section.note.kind === "tip" ? (
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-sky-500" aria-label={labels.tip} />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" aria-label={labels.warning} />
          )}
          <span className="min-w-0">{section.note.text[locale]}</span>
        </div>
      )}
    </div>
  );
}
