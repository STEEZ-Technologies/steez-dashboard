import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import { readLocalized } from "@/lib/localized";
import { getPublicUrl } from "@/lib/oss";

// Live data, never a build-time snapshot — see articles/route.ts.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** The client's certificates and documents, by section, in order. `href` is
 *  either a path the site already serves ("/documents/…") or an absolute URL
 *  to the uploaded file, which the site's build copies in. A group with no
 *  published documents is left out. Both lists are null while the client has
 *  no groups at all, which the site reads as "keep your own copy".
 *  Localized fields are { en, zh?, … }. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 404, headers: CORS_HEADERS });
  }

  const groups = await prisma.documentGroup.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    include: { documents: { where: { published: true }, orderBy: { sortOrder: "asc" } } },
  });

  const section = (s: "CERTIFICATES" | "COMPANY") =>
    groups.length === 0
      ? null
      : groups
        .filter((g) => g.section === s && g.documents.length > 0)
        .map((g) => ({
          id: g.id,
          title: readLocalized(g.title),
          documents: g.documents.map((d) => ({
            id: d.id,
            label: readLocalized(d.label),
            href: d.filePath.startsWith("/") ? d.filePath : getPublicUrl(d.filePath),
          })),
        }));

  return NextResponse.json(
    { certificates: section("CERTIFICATES"), company: section("COMPANY") },
    { headers: CORS_HEADERS },
  );
}
