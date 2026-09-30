"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/* One language on screen at a time instead of English and Chinese side by
 * side. Every field is still rendered — the other language's fields are only
 * `hidden` — so a form posts both languages exactly as it did before, and no
 * server action or column changes.
 *
 * <LanguageScope> holds the selected language for a whole page, so a form and
 * the block editor below it switch together from the one <LanguageTabs> row.
 * <Bilingual> outside a scope renders both languages side by side, which is
 * what every form did before this existed. */

export type EditLang = "en" | "zh";

const LANGS: { id: EditLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
];

type Scope = {
  lang: EditLang;
  setLang: (lang: EditLang) => void;
  missing: EditLang[];
};

const LanguageContext = createContext<Scope | null>(null);

/* A language is flagged as missing when one of its fields is empty while the
   English field in the same position has text — which is what "untranslated"
   means here. Fields are paired by DOM order inside the scope, so a block
   editor's rows pair up the same way the form's do. A field marked
   `optional` (SEO extras a language may deliberately leave blank) is skipped
   on both sides, so the pairs stay aligned. */
function findMissing(root: HTMLElement): EditLang[] {
  const fields = (lang: EditLang) =>
    Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        [`input:not([type=hidden])`, `textarea`]
          .map((tag) => `[data-edit-lang="${lang}"]:not([data-edit-optional]) ${tag}`)
          .join(", "),
      ),
    );
  const en = fields("en");
  const zh = fields("zh");
  return zh.some((field, i) => !field.value.trim() && en[i]?.value.trim()) ? ["zh"] : [];
}

/** Switch the page's edit language from inside a scope (null outside one). */
export function useSetEditLanguage() {
  return useContext(LanguageContext)?.setLang ?? null;
}

export function LanguageScope({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<EditLang>("en");
  const [missing, setMissing] = useState<EditLang[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const recompute = () => {
      const next = findMissing(root);
      setMissing((prev) => (prev.join() === next.join() ? prev : next));
    };
    recompute();

    // A required field in the hidden language can't show the browser's
    // "please fill in" bubble, and the submit silently does nothing. Switch
    // to that language first, synchronously, so the browser can focus it.
    const onInvalid = (e: Event) => {
      const owner = (e.target as HTMLElement).closest<HTMLElement>("[data-edit-lang]");
      const target = owner?.dataset.editLang as EditLang | undefined;
      if (target) flushSync(() => setLang(target));
    };

    // Blocks are added and removed without this component re-rendering.
    const observer = new MutationObserver(recompute);
    observer.observe(root, { childList: true, subtree: true });
    root.addEventListener("input", recompute);
    root.addEventListener("invalid", onInvalid, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("input", recompute);
      root.removeEventListener("invalid", onInvalid, true);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, missing }}>
      <div ref={rootRef}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function LanguageTabs({ className }: { className?: string }) {
  const scope = useContext(LanguageContext);
  if (!scope) return null;
  return (
    <div
      className={cn(
        "sticky top-2 z-20 mb-4 flex max-w-2xl items-center gap-3 rounded-xl border bg-background/85 p-2 backdrop-blur",
        className,
      )}
    >
      <span className="pl-1 text-xs font-medium text-muted-foreground">Writing in</span>
      <Tabs value={scope.lang} onValueChange={(v) => v && scope.setLang(v as EditLang)}>
        <TabsList>
          {LANGS.map((l) => (
            <TabsTrigger key={l.id} value={l.id} className="px-3">
              {l.label}
              {scope.missing.includes(l.id) && (
                <span
                  className="size-1.5 rounded-full bg-amber-500"
                  aria-label="Some fields not translated yet"
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

/** The same field in both languages. Only the selected one is visible inside
    a <LanguageScope>; outside one, both sit side by side. */
export function Bilingual({
  en,
  zh,
  optional,
  className,
}: {
  en: React.ReactNode;
  zh: React.ReactNode;
  /** Blank in one language is fine — don't flag it as untranslated. */
  optional?: boolean;
  className?: string;
}) {
  const scope = useContext(LanguageContext);
  const opt = optional ? "" : undefined;
  if (!scope) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
        <div data-edit-lang="en" data-edit-optional={opt} className="grid gap-2">
          {en}
        </div>
        <div data-edit-lang="zh" data-edit-optional={opt} className="grid gap-2">
          {zh}
        </div>
      </div>
    );
  }
  return (
    <div className={className}>
      <div data-edit-lang="en" data-edit-optional={opt} className="grid gap-2" hidden={scope.lang !== "en"}>
        {en}
      </div>
      <div data-edit-lang="zh" data-edit-optional={opt} className="grid gap-2" hidden={scope.lang !== "zh"}>
        {zh}
      </div>
    </div>
  );
}
