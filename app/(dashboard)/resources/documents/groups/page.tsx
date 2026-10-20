import { redirect } from "next/navigation";

// The breadcrumb's "Group" link: groups are listed on the documents page.
export default function DocumentGroupsPage() {
  redirect("/resources/documents");
}
