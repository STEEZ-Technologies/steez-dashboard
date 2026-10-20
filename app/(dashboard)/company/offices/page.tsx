import { redirect } from "next/navigation";

// The breadcrumb's "Offices" link: the list lives on the Company page.
export default function OfficesPage() {
  redirect("/company");
}
