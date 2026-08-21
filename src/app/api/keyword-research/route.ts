import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { getClientForUser } from "@/lib/dataforseo/client";

const bodySchema = z.object({
  projectId: z.string(),
  keyword: z.string().min(1),
  locationCode: z.number(),
  languageCode: z.string(),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
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
  const { projectId, keyword, locationCode, languageCode, device } = parsed.data;

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
    const [volume, related, suggestions] = await Promise.all([
      client.keywordOverview({
        keyword,
        location_code: locationCode,
        language_code: languageCode,
      }),
      client.relatedKeywords({
        keyword,
        location_code: locationCode,
        language_code: languageCode,
        limit: 50,
      }),
      client.keywordSuggestions({
        keyword,
        location_code: locationCode,
        language_code: languageCode,
        limit: 50,
      }),
    ]);

    const volumeResult: any = (volume as any)?.tasks?.[0]?.result?.[0] ?? {};

    const saved = await prisma.keywordResearch.create({
      data: {
        projectId,
        seedKeyword: keyword,
        country: String(locationCode),
        language: languageCode,
        device,
        searchVolume: volumeResult.search_volume ?? null,
        cpc: volumeResult.cpc ?? null,
        competition: volumeResult.competition ?? null,
        trendData: volumeResult.monthly_searches ?? undefined,
        relatedKeywords: (related as any)?.tasks?.[0]?.result ?? undefined,
        suggestions: (suggestions as any)?.tasks?.[0]?.result ?? undefined,
      },
    });

    return NextResponse.json({ result: saved });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "DataForSEO request failed" },
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

  const history = await prisma.keywordResearch.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({ history });
}
