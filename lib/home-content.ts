import { localizedFromForm, readLocalized, type LocalizedText } from "@/lib/localized";

/* The homepage's opening claim and its four figures (HomeContent), as the
 * form posts them and the site reads them. Each figure is
 * { figure, unit, label, body, href }: figure and label need English, unit
 * and body may be blank, and href is the site page the figure links to. */

export const STAT_COUNT = 4;

export type HomeStat = {
  figure: LocalizedText;
  unit: LocalizedText | null;
  label: LocalizedText;
  body: LocalizedText | null;
  href: string;
};

export type HomeContentInput = {
  heroTitle: LocalizedText;
  heroSub: LocalizedText;
  stats: HomeStat[];
};

// A page on the client's own site ("/information/") or a full URL.
const HREF = /^(\/[\w\-./#]*|https?:\/\/\S+)$/;

export function homeContentFromForm(
  formData: FormData,
): { data: HomeContentInput } | { error: "title" | "sub" | "figure" | "label" | "href"; stat?: number } {
  const heroTitle = localizedFromForm(formData, "heroTitle");
  if (!heroTitle) return { error: "title" };
  const heroSub = localizedFromForm(formData, "heroSub");
  if (!heroSub) return { error: "sub" };

  const stats: HomeStat[] = [];
  for (let i = 0; i < STAT_COUNT; i++) {
    const figure = localizedFromForm(formData, `stat${i}_figure`);
    if (!figure) return { error: "figure", stat: i };
    const label = localizedFromForm(formData, `stat${i}_label`);
    if (!label) return { error: "label", stat: i };
    const href = String(formData.get(`stat${i}_href`) ?? "").trim() || "/";
    if (!HREF.test(href)) return { error: "href", stat: i };
    stats.push({
      figure,
      unit: localizedFromForm(formData, `stat${i}_unit`),
      label,
      body: localizedFromForm(formData, `stat${i}_body`),
      href,
    });
  }
  return { data: { heroTitle, heroSub, stats } };
}

/** The stored figures, cleaned; [] when there are none. */
export function readStats(v: unknown): HomeStat[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((s) => {
    if (!s || typeof s !== "object") return [];
    const o = s as Record<string, unknown>;
    const figure = readLocalized(o.figure);
    const label = readLocalized(o.label);
    if (!figure || !label) return [];
    return [
      {
        figure,
        unit: readLocalized(o.unit),
        label,
        body: readLocalized(o.body),
        href: typeof o.href === "string" && HREF.test(o.href) ? o.href : "/",
      },
    ];
  });
}
