import type { Prisma } from "@/app/generated/prisma/client";
import { ENQUIRY_FIELDS, enquiryFilters, type EnquirySearch, type EnquiryFilters } from "@/lib/kawada-enquiry-options";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST", "ARCHIVED"] as const;
export const OPEN_LEAD_STATUSES = ["NEW", "CONTACTED", "QUOTED"] as const;
export const ENQUIRY_PAGE_SIZE = 25;

const reports = ["received", "won", "market", "kawada"] as const;
type Report = (typeof reports)[number];
export type EnquiryPeriod = { start: Date; end: Date };

export function reportPeriod(days: number, end = new Date()): EnquiryPeriod {
  return { start: new Date(end.getTime() - days * 86_400_000), end };
}

export function enquiryHref(parameters: Record<string, string> = {}) {
  const query = new URLSearchParams(Object.entries(parameters).filter(([, value]) => value !== ""));
  return query.size ? `/leads?${query}` : "/leads";
}

export function reportParameters(report: Report, period: EnquiryPeriod) {
  return { report, from: period.start.toISOString(), to: period.end.toISOString() };
}

function isoDate(value: string) {
  if (!/^\d{4}-/.test(value) || value.startsWith("0000-")) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value ? date : null;
}

export function parseEnquiryQuery(input: EnquirySearch, kawada: boolean) {
  const read = (key: string, max = 500) => {
    const value = input[key];
    return typeof value === "string" && value.length <= max && !value.includes("\0") ? value : "";
  };
  const candidate = read("report") as Report;
  const start = isoDate(read("from"));
  const end = isoDate(read("to"));
  const period = start && end && start < end ? { start, end } : null;
  const report = period && reports.includes(candidate) && (candidate !== "kawada" || kawada) ? candidate : undefined;
  const status = LEAD_STATUSES.find((value) => value === read("status"));
  const q = read("q", 200).trim();
  const filters = kawada ? enquiryFilters(input) : {};
  const segmentField = ENQUIRY_FIELDS.find((field) => field === read("segmentField"));
  const segmentValue = read("segmentValue");
  const segmentEmpty = read("segmentEmpty") === "1";
  const segment = report === "kawada" && segmentField && (segmentValue || segmentEmpty || read("segmentMissing") === "1")
    ? { field: segmentField, value: segmentEmpty ? "" : segmentValue || null }
    : undefined;
  const sourceValue = read("source");
  const source = (report === "market" || report === "kawada") && (sourceValue || read("unknownSource") === "1")
    ? { value: sourceValue || null }
    : undefined;
  const country = report === "market" ? read("country", 16) : "";
  const unattributed = report === "kawada" && read("unattributed") === "1";
  const pageValue = read("page");
  const requestedPage = /^[1-9]\d*$/.test(pageValue) && Number.isSafeInteger(Number(pageValue)) ? Number(pageValue) : 1;
  const parameters = {
    ...(report && period ? reportParameters(report, period) : {}),
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...filters,
    ...(country ? { country } : {}),
    ...(source ? source.value === null ? { unknownSource: "1" } : { source: source.value } : {}),
    ...(segment ? { segmentField: segment.field, ...(segment.value === null ? { segmentMissing: "1" } : segment.value === "" ? { segmentEmpty: "1" } : { segmentValue: segment.value }) } : {}),
    ...(unattributed ? { unattributed: "1" } : {}),
  };
  return { report, period, status, q, filters, country, source, segment, unattributed, requestedPage, parameters };
}

export function enquiryWhere(
  tenantId: string,
  scope: {
    report?: Report;
    period?: EnquiryPeriod | null;
    status?: (typeof LEAD_STATUSES)[number];
    filters?: EnquiryFilters;
    q?: string;
    country?: string;
    segment?: { field: (typeof ENQUIRY_FIELDS)[number]; value: string | null };
  } = {},
) {
  const { report, period, status, filters, q, country, segment } = scope;
  const interval = period && { gte: period.start, lt: period.end };
  const terms: Prisma.LeadWhereInput[] = [];
  if (report && interval) {
    terms.push(report === "won"
      ? { closedAt: interval, status: "WON" }
      : { createdAt: interval, ...(report !== "kawada" ? { status: { not: "ARCHIVED" } } : {}) });
  }
  if (status) terms.push({ status });
  if (filters && Object.keys(filters).length > 0) terms.push(filters);
  if (country) terms.push({ country });
  if (segment) terms.push({ [segment.field]: segment.value });
  if (q) {
    // Prisma's PostgreSQL contains operator uses LIKE. Match wildcard characters literally.
    const match = { contains: q.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" as const };
    terms.push({
      OR: [
        { name: match }, { email: match }, { phone: match }, { company: match }, { message: match },
        { product: { is: { OR: [{ name: match }, { model: match }] } } },
      ],
    });
  }
  return { tenantId, AND: terms };
}
