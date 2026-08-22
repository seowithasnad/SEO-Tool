import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { getClientForUser } from "@/lib/dataforseo/client";
import { analyzeSerp } from "@/lib/ai/analyze-serp";

const bodySchema = z.object({
  projectId: z.string(),
  keyword: z.string().min(1),
  locationCode: z.number(),
  languageCode: z.string(),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
  depth: z.number().min(10).max(100).default(20),
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
  const { projectId, keyword, locationCode, languageCode, device, depth } =
    parsed.data;

  const apiSettings = await prisma.apiSettings.findUnique({
    where: { userId: (session.user as any).id },
  });
  if (!apiSettings?.dataForSeoLogin || !apiSettings?.dataForSeoPassword) {
    return NextResponse.json(
      { error: "Add your DataForSEO credentials in Settings first." },
      { status: 412 }
    );
  }

  const dfsClient = getClientForUser(
    apiSettings.dataForSeoLogin,
    apiSettings.dataForSeoPassword
  );

  try {
    const serpRaw: any = await dfsClient.serpOrganic({
      keyword,
      location_code: locationCode,
      language_code: languageCode,
      device,
      depth,
    });

    const items: any[] = serpRaw?.tasks?.[0]?.result?.[0]?.items ?? [];
    const organicItems = items.filter((i) => i.type === "organic");
    const paaItem = items.find((i) => i.type === "people_also_ask");
    const peopleAlsoAsk: string[] = (paaItem?.items ?? [])
      .map((q: any) => q.title)
      .filter(Boolean);
    const hasAiOverview = items.some((i) => i.type === "ai_overview");
    const hasFeaturedSnippet = items.some(
      (i) => i.type === "featured_snippet"
    );

    let aiAnalysis = null;
    let aiError: string | null = null;
    try {
      aiAnalysis = await analyzeSerp({
        keyword,
        rawOrganicItems: organicItems,
        peopleAlsoAsk,
        hasAiOverview,
        hasFeaturedSnippet,
        userClaudeKey: apiSettings.claudeKey,
      });
    } catch (e: any) {
      // Don't fail the whole request if AI analysis fails — SERP data is still useful.
      aiError = e.message ?? "AI analysis failed";
    }

    const saved = await prisma.serpAnalysis.create({
      data: {
        projectId,
        keyword,
        country: String(locationCode),
        language: languageCode,
        device,
        rawResults: organicItems,
        hasAiOverview,
        hasFeaturedSnippet,
        peopleAlsoAsk,
        aiAnalysis: (aiAnalysis ?? undefined) as any,
        seoScore: aiAnalysis?.seoScore ?? null,
        aiSearchScore: aiAnalysis?.aiSearchScore ?? null,
      },
    });

    return NextResponse.json({ result: saved, aiError });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "SERP analysis failed" },
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

  const history = await prisma.serpAnalysis.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({ history });
}
