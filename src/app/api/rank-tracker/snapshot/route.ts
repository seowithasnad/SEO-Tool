import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getClientForUser } from "@/lib/dataforseo/client";

// Visibility is a simple 0-100 decay curve: rank 1 = 100, rank 100 = ~1, not ranked = 0.
// Swap for a CTR-weighted model once you have real click data per position.
function visibilityForPosition(position: number | null) {
  if (position == null) return 0;
  if (position > 100) return 0;
  return Math.round(((101 - position) / 100) * 100);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trackedKeywords = await prisma.trackedKeyword.findMany({
    where: { isActive: true },
    include: {
      project: { include: { user: { include: { apiSettings: true } } } },
    },
  });

  const results: { keywordId: string; status: string }[] = [];

  for (const tk of trackedKeywords) {
    const creds = tk.project.user.apiSettings;
    if (!creds?.dataForSeoLogin || !creds?.dataForSeoPassword) {
      results.push({ keywordId: tk.id, status: "skipped: no DataForSEO creds" });
      continue;
    }

    try {
      const client = getClientForUser(
        creds.dataForSeoLogin,
        creds.dataForSeoPassword
      );

      const serp: any = await client.serpOrganic({
        keyword: tk.keyword,
        location_code: Number(tk.country),
        language_code: tk.language,
        device: tk.device as "desktop" | "mobile",
        depth: 100,
      });

      const items: any[] = serp?.tasks?.[0]?.result?.[0]?.items ?? [];
      const organic = items.filter((i) => i.type === "organic");

      const matchDomain = tk.project.domain.replace(/^www\./, "");
      const hit = organic.find((item) =>
        (item.domain ?? "").replace(/^www\./, "").includes(matchDomain)
      );

      const position = hit?.rank_absolute ?? null;

      await prisma.rankSnapshot.create({
        data: {
          projectId: tk.projectId,
          trackedKeywordId: tk.id,
          position,
          url: hit?.url ?? null,
          visibility: visibilityForPosition(position),
        },
      });

      results.push({ keywordId: tk.id, status: "ok" });
    } catch (err: any) {
      results.push({ keywordId: tk.id, status: `error: ${err.message}` });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
