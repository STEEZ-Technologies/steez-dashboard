import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "@/lib/cors";
import { readLocalized } from "@/lib/localized";

// Live data, never a build-time snapshot — see articles/route.ts.
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** The client's contact details and offices, as their site prints them.
 *  `profile` is null until one is saved, which the site reads as "keep your
 *  own copy". Localized fields are { en, zh?, fr?, it?, es?, ja? }. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 404, headers: CORS_HEADERS });
  }

  const [profile, offices] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { tenantId: tenant.id } }),
    prisma.office.findMany({
      where: { tenantId: tenant.id, published: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const payload = {
    profile: profile
      ? {
          email: profile.email,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          icpNumber: profile.icpNumber,
          catalogueUrl: profile.catalogueUrl,
          replyWithin: readLocalized(profile.replyWithin),
          footerAddress: readLocalized(profile.footerAddress),
          sales: profile.salesName
            ? {
                name: profile.salesName,
                role: readLocalized(profile.salesRole),
                base: readLocalized(profile.salesBase),
                whatsapp: profile.salesWhatsapp,
                email: profile.salesEmail,
                web: profile.salesWeb,
              }
            : null,
          socials: Array.isArray(profile.socials) ? profile.socials : [],
        }
      : null,
    offices: offices.map((o) => ({
      id: o.key,
      name: readLocalized(o.name),
      company: readLocalized(o.company),
      address: readLocalized(o.address),
      tel: o.tel,
      fax: o.fax,
      email: o.email,
      web: o.web,
      line: o.line,
      // "lat,lon", the site's own marker format; null without a point.
      marker: o.lat != null && o.lon != null ? `${o.lat},${o.lon}` : null,
      showMap: o.showMap,
    })),
  };

  return NextResponse.json(payload, { headers: CORS_HEADERS });
}
