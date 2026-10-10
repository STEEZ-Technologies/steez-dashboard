import { redirect } from "next/navigation";

// The breadcrumb links here; handovers are per workspace, listed on /admin.
export default function HandoverIndex() {
  redirect("/admin");
}
