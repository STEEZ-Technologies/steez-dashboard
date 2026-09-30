"use client";

import { flushSync } from "react-dom";
import { useSelectProductTab } from "@/components/products/product-tabs";
import { useSetEditLanguage } from "@/components/shared/language-tabs";
import type { Completeness, CompletenessKey } from "@/lib/completeness";
import { useT } from "@/lib/i18n/provider";

// Fields that live in one language of the form, and the input to focus.
const LANG: Partial<Record<CompletenessKey, "en" | "zh">> = {
  nameZh: "zh",
  description: "en",
  descriptionZh: "zh",
};
const FIELD_ID: Partial<Record<CompletenessKey, string>> = {
  nameZh: "nameZh",
  description: "description",
  descriptionZh: "descriptionZh",
};

/** "Missing: Chinese name, Specs" under the edit page header. Each gap opens
 *  the tab (and language) it lives in and focuses the field. Hidden when the
 *  product is complete. */
export function CompletenessBar({ completeness }: { completeness: Completeness }) {
  const { dict } = useT();
  const selectTab = useSelectProductTab();
  const setLang = useSetEditLanguage();
  if (completeness.missing.length === 0) return null;

  function open(key: CompletenessKey, tab: Completeness["missing"][number]["tab"]) {
    flushSync(() => {
      selectTab?.(tab);
      const lang = LANG[key];
      if (lang) setLang?.(lang);
    });
    const id = FIELD_ID[key];
    const el = id ? document.getElementById(id) : null;
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <div className="mb-4 max-w-2xl rounded-xl bg-muted/50 px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        <span className="tabular-nums font-medium text-foreground">
          {completeness.done}/{completeness.total}
        </span>{" "}
        · {dict.products.completenessHint}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {completeness.missing.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => open(m.key, m.tab)}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            {dict.products.gaps[m.key]}
          </button>
        ))}
      </div>
    </div>
  );
}
