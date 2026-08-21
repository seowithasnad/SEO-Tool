import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import {
  buildContentBriefPdf,
  buildSerpAnalysisPdf,
  buildSiteAuditPdf,
} from "@/lib/reports/pdf";
import {
  buildCompetitorExcel,
  buildKeywordResearchExcel,
  buildSiteAuditExcel,
} from "@/lib/reports/excel";
import { keywordResearchToCsv, siteAuditToCsv, buildCsv } from "@/lib/reports/csv";
import { buildContentBriefPptx, buildSerpAnalysisPptx } from "@/lib/reports/pptx";

const bodySchema = z.object({
  projectId: z.string(),
  source: z.enum([
    "keyword-research",
    "serp-analysis",
    "competitor",
    "site-audit",
    "content-brief",
  ]),
  sourceId: z.string(),
  format: z.enum(["pdf", "excel", "csv", "pptx"]),
  whiteLabel: z.boolean().default(false),
  agencyName: z.string().optional(),
  clientName: z.string().optional(),
});

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
const EXT: Record<string, string> = {
  pdf: "pdf",
  excel: "xlsx",
  csv: "csv",
  pptx: "pptx",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId, source, sourceId, format, whiteLabel, agencyName, clientName } =
    parsed.data;

  const branding = { whiteLabel, agencyName, clientName };
  let fileBuffer: Buffer | string;
  let baseName = "report";

  try {
    if (source === "keyword-research") {
      const row = await prisma.keywordResearch.findUniqueOrThrow({
        where: { id: sourceId },
      });
      baseName = row.seedKeyword;
      if (format === "excel") {
        fileBuffer = await buildKeywordResearchExcel([row as any]);
      } else if (format === "csv") {
        fileBuffer = keywordResearchToCsv([row as any]);
      } else {
        return NextResponse.json(
          { error: "Keyword research supports Excel or CSV only." },
          { status: 400 }
        );
      }
    } else if (source === "serp-analysis") {
      const row = await prisma.serpAnalysis.findUniqueOrThrow({
        where: { id: sourceId },
      });
      baseName = row.keyword;
      if (format === "pdf") {
        fileBuffer = await buildSerpAnalysisPdf(row as any, branding);
      } else if (format === "pptx") {
        fileBuffer = await buildSerpAnalysisPptx(row as any, branding);
      } else if (format === "csv") {
        const gaps: string[] = (row.aiAnalysis as any)?.contentGaps ?? [];
        fileBuffer = buildCsv(
          ["Keyword", "Content Gap"],
          gaps.map((g) => [row.keyword, g])
        );
      } else {
        return NextResponse.json(
          { error: "SERP analysis supports PDF, PPTX, or CSV only." },
          { status: 400 }
        );
      }
    } else if (source === "content-brief") {
      const row = await prisma.contentItem.findUniqueOrThrow({
        where: { id: sourceId },
      });
      baseName = row.targetKeyword;
      if (format === "pdf") {
        fileBuffer = await buildContentBriefPdf(row as any, branding);
      } else if (format === "pptx") {
        fileBuffer = await buildContentBriefPptx(row as any, branding);
      } else {
        return NextResponse.json(
          { error: "Content briefs support PDF or PPTX only." },
          { status: 400 }
        );
      }
    } else if (source === "competitor") {
      const row = await prisma.competitor.findUniqueOrThrow({
        where: { id: sourceId },
      });
      baseName = row.domain;
      if (format === "excel") {
        fileBuffer = await buildCompetitorExcel(row as any);
      } else {
        return NextResponse.json(
          { error: "Competitor analysis supports Excel only." },
          { status: 400 }
        );
      }
    } else {
      const row = await prisma.siteAudit.findUniqueOrThrow({
        where: { id: sourceId },
      });
      baseName = row.target ?? "site-audit";
      if (format === "pdf") {
        fileBuffer = await buildSiteAuditPdf(row as any, branding);
      } else if (format === "excel") {
        fileBuffer = await buildSiteAuditExcel(row as any);
      } else if (format === "csv") {
        fileBuffer = siteAuditToCsv(row as any);
      } else {
        return NextResponse.json(
          { error: "Site audits support PDF, Excel, or CSV only." },
          { status: 400 }
        );
      }
    }

    await prisma.report.create({
      data: {
        projectId,
        type: format,
        label: `${source}: ${baseName}`,
        whiteLabel,
      },
    });

    const filename = `${baseName.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.${EXT[format]}`;

    return new NextResponse(fileBuffer as any, {
      headers: {
        "Content-Type": MIME[format],
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to generate report" },
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

  const reports = await prisma.report.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ reports });
}
