import missingPreviewText from "./kawada-preview-text.json";

// Positions refer to the imported copy and stay stable after an edit or removal.
const fixedText: Record<string, Array<[from: number, to: number]>> = {
  home: [[8,8],[11,11],[80,80],[87,87]],
  products: [[5,39]],
  "contact-us": [[5,42],[49,50]],
  news: [[0,5],[14,15],[20,21],[24,25]],
  catalogue: [[3,4],[8,99]],
};

export function isFixedWebsiteText(page: string, position: number) {
  return fixedText[page]?.some(([from,to]) => position >= from && position <= to) ?? false;
}

export function websiteTextLimit(text: string) {
  return Math.max(160, Math.ceil(text.length * 1.25));
}

// The history timeline has no picture slots.
export function isFixedWebsiteMedia(page: string, section: number) {
  return page === "about-us" && section === 48;
}


// Field 75 was appended to avoid renumbering saved entries. Display it beside
// the final milestone year, between that year (61) and its description (62).
export function websiteCopyOrder(page: string, position: number) {
  if (page === "about-us" && position === 75) return 61.5;
  if (page === "home" && position === 90) return 0.5;
  // This phrase follows the consultation link immediately before the process.
  if (page === "oem-odm" && position === 17) return 16.5;
  return position;
}


// Seeded slots use the import's deterministic MD5 id. Workspace additions use CUIDs.
export function isTemplateMediaSlot(id?: string) {
  return !!id && /^[a-f0-9]{32}$/.test(id);
}

export function hasWebsitePreviewSlot(page: string, language: string, position: number) {
  const missing = missingPreviewText[`${page}/${language}` as keyof typeof missingPreviewText];
  return !missing?.includes(position);
}
