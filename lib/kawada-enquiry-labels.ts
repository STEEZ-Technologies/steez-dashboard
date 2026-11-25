import type { Dictionary, Locale } from "@/lib/i18n";
import type { EnquiryField } from "@/lib/kawada-enquiry-options";

export function enquiryLabel(field: EnquiryField, value: string, dict: Dictionary, locale: Locale) {
  switch (field) {
    case "buyerCountry":
      return new Intl.DisplayNames([locale], { type: "region" }).of(value) ?? value;
    case "formLanguage":
      return new Intl.DisplayNames([locale], { type: "language" }).of(value) ?? value;
    case "productInterest":
      return dict.enquiryAnalytics.interests[value as keyof typeof dict.enquiryAnalytics.interests] ?? value;
    case "orderVolume":
      return dict.enquiryAnalytics.volumes[value as keyof typeof dict.enquiryAnalytics.volumes] ?? value;
  }
}
