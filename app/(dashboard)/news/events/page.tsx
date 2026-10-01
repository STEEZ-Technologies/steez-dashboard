import { redirect } from "next/navigation";

// Events are listed on the News page; this keeps the breadcrumb link live.
export default function NewsEventsPage() {
  redirect("/news");
}
