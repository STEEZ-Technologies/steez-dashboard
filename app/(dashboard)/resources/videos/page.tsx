import { redirect } from "next/navigation";

// Videos are listed on the Resources page; this keeps the breadcrumb link live.
export default function VideosPage() {
  redirect("/resources");
}
