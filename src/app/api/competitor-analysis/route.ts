import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { getClientForUser } from "@/lib/dataforseo/client";

const bodySchema = z.object({
  projectId: z.string(),
  competitorDomain: z.string().min(1),
  locationCode: z.number(),
  languageCode: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId, competitorDomain, locationCode, languageCode } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const apiSettings = await prisma.apiSettings.findUnique({
    where: { userId: (session.user as any).id },
  });
  if (!apiSettings?.dataForSeoLogin || !apiSettings?.dataForSeoPassword) {
    return NextResponse.json(
      { error: "Add your DataForSEO credentials in Settings first." },
      { status: 412 }
    );
  }

  const client = getClientForUser(
    apiSettings.dataForSeoLogin,
    apiSettings.dataForSeoPassword
  );

  try {
    const [overview, topPages, topKeywords, backlinks, intersection] =
      await Promise.all([
        client.domainRankOverview({
          target: competitorDomain,
          location_code: locationCode,
          language_code: languageCode,
        }),
        client.relevantPages({
          target: competitorDomain,
          location_code: locationCode,
          language_code: languageCode,
          limit: 20,
        }),
        client.rankedKeywords({
          target: competitorDomain,
          location_code: locationCode,
          language_code: languageCode,
          limit: 50,
        }),
        client.backlinksSummary({ target: competitorDomain }),
        // Content gap: keywords the competitor ranks for that your project's
        // domain does not — this is what domain_intersection surfaces when the
        // "exclude" filter targets your own domain in the request payload.
        client.domainIntersection({
          target1: project.domain,
          target2: competitorDomain,
          location_code: locationCode,
          language_code: languageCode,
        }),
      ]);

    const overviewResult: any =
      (overview as any)?.tasks?.[0]?.result?.[0] ?? {};
    const estTraffic =
      overviewResult?.metrics?.organic?.etv ??
      overviewResult?.metrics?.organic?.count ??
      null;

    const saved = await prisma.competitor.create({
      data: {
        projectId,
        domain: competitorDomain,
        topPages: (topPages as any)?.tasks?.[0]?.result?.[0]?.items ?? undefined,
        topKeywords:
          (topKeywords as any)?.tasks?.[0]?.result?.[0]?.items ?? undefined,
        backlinks: (backlinks as any)?.tasks?.[0]?.result?.[0] ?? undefined,
        contentGaps:
          (intersection as any)?.tasks?.[0]?.result?.[0]?.items ?? undefined,
        estTraffic: typeof estTraffic === "number" ? Math.round(estTraffic) : null,
      },
    });

    return NextResponse.json({ result: saved });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Competitor analysis failed" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const history = await prisma.competitor.findMany({
    where: { projectId },
    orderBy: { lastAnalyzed: "desc" },
    take: 10,
  });

  return NextResponse.json({ history });
}
