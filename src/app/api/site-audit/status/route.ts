import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { getClientForUser } from "@/lib/dataforseo/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const audit = await prisma.siteAudit.findUnique({ where: { id } });
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Already finished (or failed) — nothing left to poll.
  if (audit.status === "completed" || audit.status === "failed") {
    return NextResponse.json({ audit });
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
    const summary: any = await client.onPageSummary({
      id: audit.dataForSeoTaskId!,
    });
    const result = summary?.tasks?.[0]?.result?.[0];
    const progress = result?.crawl_progress; // "in_progress" | "finished"

    if (progress !== "finished") {
      return NextResponse.json({ audit, crawlProgress: progress ?? "queued" });
    }

    const pagesRes: any = await client.onPagePages({
      id: audit.dataForSeoTaskId!,
      limit: 200,
    });
    const pages: any[] = pagesRes?.tasks?.[0]?.result?.[0]?.items ?? [];

    const brokenLinks = pages.filter(
      (p) => p.status_code >= 400 || p.checks?.is_broken
    );
    const headingIssues = pages.filter(
      (p) => p.checks?.no_h1_tag || p.checks?.duplicate_title_tag
    );
    const metaIssues = pages.filter(
      (p) =>
        p.checks?.no_title ||
        p.checks?.no_description ||
        p.checks?.duplicate_title_tag ||
        p.checks?.duplicate_description_tag ||
        p.checks?.title_too_long ||
        p.checks?.title_too_short
    );
    const imageIssues = pages.filter((p) => p.checks?.no_image_alt);
    const speedData = pages
      .map((p) => ({
        url: p.url,
        loadTimeMs: p.page_timing?.time_to_interactive ?? null,
      }))
      .filter((p) => p.loadTimeMs != null);
    const schemaData = pages
      .filter((p) => p.checks?.no_schema_markup !== undefined)
      .map((p) => ({
        url: p.url,
        hasSchema: !p.checks?.no_schema_markup,
      }));

    const issuesSummary = {
      pagesCrawled: pages.length,
      brokenLinksCount: brokenLinks.length,
      headingIssuesCount: headingIssues.length,
      metaIssuesCount: metaIssues.length,
      imageIssuesCount: imageIssues.length,
      domainInfo: result?.domain_info ?? null,
      pageMetrics: result?.page_metrics ?? null,
    };

    const updated = await prisma.siteAudit.update({
      where: { id: audit.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        issuesSummary: issuesSummary as any,
        brokenLinks: brokenLinks.slice(0, 100).map((p) => ({
          url: p.url,
          statusCode: p.status_code,
        })) as any,
        headingIssues: headingIssues.slice(0, 100).map((p) => ({
          url: p.url,
        })) as any,
        metaIssues: metaIssues.slice(0, 100).map((p) => ({ url: p.url })) as any,
        imageIssues: imageIssues.slice(0, 100).map((p) => ({ url: p.url })) as any,
        speedData: speedData.slice(0, 100) as any,
        schemaData: schemaData.slice(0, 100) as any,
      },
    });

    return NextResponse.json({ audit: updated, crawlProgress: "finished" });
  } catch (err: any) {
    await prisma.siteAudit.update({
      where: { id: audit.id },
      data: { status: "failed" },
    });
    return NextResponse.json(
      { error: err.message ?? "Failed to poll site audit" },
      { status: 502 }
    );
  }
}