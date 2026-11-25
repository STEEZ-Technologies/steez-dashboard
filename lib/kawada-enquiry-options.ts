import { COUNTRY_CODES } from "@/lib/kawada-countries";

// Wire IDs come from Kawada's contact form. Labels are translated separately.
export const ENQUIRY_OPTIONS = {
  buyerCountry: COUNTRY_CODES,
  productInterest: [
    "sanitary-pads", "pantyliners", "incontinence-pads", "period-pants",
    "maternity-pads", "breast-pads", "oem-odm", "co-development",
    "custom-development", "custom-embossing", "exhibition", "other",
  ],
  orderVolume: [
    "under-100000", "100000-500000", "500000-1000000", "1000000-5000000", "over-5000000",
  ],
  formLanguage: ["en", "zh", "es"],
};

export type EnquiryField = keyof typeof ENQUIRY_OPTIONS;
export const ENQUIRY_FIELDS = Object.keys(ENQUIRY_OPTIONS) as EnquiryField[];
export type EnquiryFilters = Partial<Record<EnquiryField, string>>;
export type EnquirySearch = Record<string, string | string[] | undefined>;

export function enquiryFilters(input: Record<string, unknown>): EnquiryFilters {
  const fields: EnquiryFilters = {};
  for (const field of ENQUIRY_FIELDS) {
    const value = input[field];
    if (typeof value === "string" && ENQUIRY_OPTIONS[field].includes(value)) {
      fields[field] = value;
    }
  }
  return fields;
}

export function invalidEnquiryField(input: Record<string, unknown>, fields: EnquiryFilters) {
  return ENQUIRY_FIELDS.find((field) =>
    input[field] != null && input[field] !== "" && !fields[field],
  );
}
