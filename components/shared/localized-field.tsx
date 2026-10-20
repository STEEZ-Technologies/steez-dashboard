"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Multilingual } from "@/components/shared/language-tabs";
import type { Locale } from "@/lib/localized";

/** One field in every language the page's <LanguageScope> edits, posted as
    `<name>_<lang>` (read back with lib/localized.ts `localizedFromForm`).
    English is the one that's required when `required` is set. */
export function LocalizedField({
  name,
  label,
  defaults,
  required,
  optional,
  multiline,
  placeholder,
  disabled,
}: {
  name: string;
  label: string;
  defaults?: Partial<Record<Locale, string>>;
  required?: boolean;
  /** Blank in a language is fine — don't flag it as untranslated. */
  optional?: boolean;
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const field = (lang: Locale) => {
    const id = `${name}_${lang}`;
    const props = {
      id,
      name: id,
      defaultValue: defaults?.[lang] ?? "",
      placeholder: lang === "en" ? placeholder : undefined,
      required: required && lang === "en",
      disabled,
    };
    return (
      <>
        <Label htmlFor={id}>{label}</Label>
        {multiline ? <Textarea rows={3} {...props} /> : <Input {...props} />}
      </>
    );
  };
  return (
    <Multilingual
      optional={optional}
      fields={{
        en: field("en"),
        zh: field("zh"),
        fr: field("fr"),
        it: field("it"),
        es: field("es"),
        ja: field("ja"),
      }}
    />
  );
}
