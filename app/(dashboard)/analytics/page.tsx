import { redirect } from "next/navigation";

// Analytics merged into the Overview page; old links and bookmarks land there.
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  redirect(range ? `/?range=${encodeURIComponent(range)}` : "/");
}
