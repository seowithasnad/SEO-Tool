import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { generateContentBrief } from "@/lib/ai/generate-content-brief";

const bodySchema = z.object({
  projectId: z.string(),
  keyword: z.string().min(1),
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
  const { projectId, keyword } = parsed.data;

  const apiSettings = await prisma.apiSettings.findUnique({
    where: { userId: (session.user as any).id },
  });

  // Pull in the most recent SERP analysis for this exact keyword, if one
  // exists, so the brief builds on real gap analysis instead of starting cold.
  const priorSerp = await prisma.serpAnalysis.findFirst({
    where: { projectId, keyword },
    orderBy: { createdAt: "desc" },
  });
  const serpContext = priorSerp?.aiAnalysis
    ? (priorSerp.aiAnalysis as any)
    : null;

  try {
    const brief = await generateContentBrief({
      keyword,
      serpContext,
      userClaudeKey: apiSettings?.claudeKey,
    });

    const saved = await prisma.contentItem.create({
      data: {
        projectId,
        targetKeyword: keyword,
        title: brief.outline.h1,
        outline: brief.outline as any,
        schema: brief.schema as any,
        internalLinks: brief.internalLinkIdeas as any,
        imageAltSuggestions: brief.imageSuggestions as any,
        seoScore: brief.seoScore,
        eeatScore: brief.eeatScore,
        aiSearchVisibilityScore: brief.aiSearchVisibilityScore,
        llmScores: brief.aiEngineNotes as any,
      },
    });

    return NextResponse.json({ contentItem: saved, brief });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to generate content brief" },
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

  const items = await prisma.contentItem.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ items });
}
