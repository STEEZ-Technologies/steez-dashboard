"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";

/* One language on screen at a time instead of English and Chinese side by
 * side. Every field is still rendered — the other language's fields are only
 * `hidden` — so a form posts both languages exactly as it did before, and no
 * server action or column changes.
 *
 * <LanguageScope> holds the selected language for a whole page, so a form and
 * the block editor below it switch together from the one <LanguageTabs> row.
 * <Bilingual> outside a scope renders both languages side by side, which is
 * what every form did before this existed. */

export type EditLang = "en" | "zh" | "fr" | "it" | "es" | "ja";

/* English and Chinese for every tenant; the other four only where a scope asks
   for them (KomiBright's site is published in all six). */
export const ALL_EDIT_LANGS: EditLang[] = ["en", "zh", "fr", "it", "es", "ja"];
const DEFAULT_LANGS: EditLang[] = ["en", "zh"];

const LANG_LABELS: Record<EditLang, string> = {
  en: "English",
  zh: "中文",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  ja: "日本語",
};

type Scope = {
  lang: EditLang;
  setLang: (lang: EditLang) => void;
  missing: EditLang[];
  langs: EditLang[];
};

const LanguageContext = createContext<Scope | null>(null);

/* A language is flagged as missing when one of its fields is empty while the
   English field in the same position has text — which is what "untranslated"
   means here. Fields are paired by DOM order inside the scope, so a block
   editor's rows pair up the same way the form's do. A field marked
   `optional` (SEO extras a language may deliberately leave blank) is skipped
   on both sides, so the pairs stay aligned. */
function findMissing(root: HTMLElement, langs: EditLang[]): EditLang[] {
  const fields = (lang: EditLang) =>
    Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        [`input:not([type=hidden])`, `textarea`]
          .map((tag) => `[data-edit-lang="${lang}"]:not([data-edit-optional]) ${tag}`)
          .join(", "),
      ),
    );
  const en = fields("en");
  return langs.filter(
    (lang) =>
      lang !== "en" &&
      fields(lang).some((field, i) => !field.value.trim() && en[i]?.value.trim()),
  );
}

/** Switch the page's edit language from inside a scope (null outside one). */
export function useSetEditLanguage() {
  return useContext(LanguageContext)?.setLang ?? null;
}

export function LanguageScope({
  children,
  langs = DEFAULT_LANGS,
}: {
  children: React.ReactNode;
  /** Which languages this page edits. English and Chinese unless told otherwise. */
  langs?: EditLang[];
}) {
  const [lang, setLang] = useState<EditLang>("en");
  const [missing, setMissing] = useState<EditLang[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const recompute = () => {
      const next = findMissing(root, langs);
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
  }, [langs]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, missing, langs }}>
      <div ref={rootRef}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function LanguageTabs({ className }: { className?: string }) {
  const scope = useContext(LanguageContext);
  const { dict } = useT();
  if (!scope) return null;
  return (
    <div
      className={cn(
        "sticky top-2 z-20 mb-4 flex max-w-2xl items-center gap-3 rounded-xl border bg-background/85 p-2 backdrop-blur",
        className,
      )}
    >
      <span className="shrink-0 pl-1 text-xs font-medium text-muted-foreground">{dict.editor.writingIn}</span>
      {/* Six languages don't fit a phone: the row scrolls sideways there. */}
      <Tabs
        value={scope.lang}
        onValueChange={(v) => v && scope.setLang(v as EditLang)}
        className="min-w-0 overflow-x-auto [scrollbar-width:none]"
      >
        <TabsList>
          {scope.langs.map((id) => (
            <TabsTrigger key={id} value={id} className="px-3">
              {LANG_LABELS[id]}
              {scope.missing.includes(id) && (
                <span
                  className="size-1.5 rounded-full bg-amber-500"
                  aria-label={dict.editor.notTranslated}
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
  // A two-language field on a page that also edits French and the rest shows
  // its English while one of those is selected, rather than vanishing.
  const showEn = scope.lang !== "zh";
  return (
    <div className={className}>
      <div data-edit-lang="en" data-edit-optional={opt} className="grid gap-2" hidden={!showEn}>
        {en}
      </div>
      <div data-edit-lang="zh" data-edit-optional={opt} className="grid gap-2" hidden={scope.lang !== "zh"}>
        {zh}
      </div>
    </div>
  );
}

/** One field in every language the scope edits. `en` and `zh` are always
    rendered; the others only when the scope includes them — so a form posts
    no `name_fr` at all on a page that doesn't edit French, and its save leaves
    whatever French is stored alone. Outside a scope it behaves like
    <Bilingual>. */
export function Multilingual({
  fields,
  optional,
  className,
}: {
  fields: { en: React.ReactNode; zh: React.ReactNode } & Partial<
    Record<Exclude<EditLang, "en" | "zh">, React.ReactNode>
  >;
  optional?: boolean;
  className?: string;
}) {
  const scope = useContext(LanguageContext);
  if (!scope) return <Bilingual en={fields.en} zh={fields.zh} optional={optional} className={className} />;
  const opt = optional ? "" : undefined;
  return (
    <div className={className}>
      {scope.langs.map((id) =>
        fields[id] === undefined ? null : (
          <div
            key={id}
            data-edit-lang={id}
            data-edit-optional={opt}
            className="grid gap-2"
            hidden={scope.lang !== id}
          >
            {fields[id]}
          </div>
        ),
      )}
    </div>
  );
}

/** Whether the current scope edits a language (false outside a scope for
    anything but English and Chinese). */
export function useEditsLanguage(lang: EditLang) {
  const scope = useContext(LanguageContext);
  return (scope?.langs ?? DEFAULT_LANGS).includes(lang);
}
