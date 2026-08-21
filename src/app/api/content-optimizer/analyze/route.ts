import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { analyzeContent } from "@/lib/ai/analyze-content";

const bodySchema = z.object({
  projectId: z.string(),
  targetKeyword: z.string().min(1),
  body: z.string().min(50, "Paste at least a few sentences to analyze."),
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
  const { projectId, targetKeyword, body } = parsed.data;

  const apiSettings = await prisma.apiSettings.findUnique({
    where: { userId: (session.user as any).id },
  });

  try {
    const analysis = await analyzeContent({
      targetKeyword,
      body,
      userClaudeKey: apiSettings?.claudeKey,
    });

    const saved = await prisma.contentItem.create({
      data: {
        projectId,
        targetKeyword,
        bodyDraft: body,
        keywordDensity: { percent: analysis.keywordDensityPercent } as any,
        semanticCoverage: analysis.semanticCoverage as any,
        entityCoverage: analysis.entityCoverage as any,
        missingQuestions: analysis.missingQuestions as any,
        readabilityScore: analysis.readabilityScore,
        eeatScore: analysis.eeatScore,
        seoScore: analysis.seoScore,
        aiSearchVisibilityScore: analysis.aiSearchVisibilityScore,
        llmScores: analysis.llmScores as any,
      },
    });

    return NextResponse.json({ contentItem: saved, analysis });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to analyze content" },
      { status: 502 }
    );
  }
}
