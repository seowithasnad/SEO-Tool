import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { getClientForUser } from "@/lib/dataforseo/client";

const bodySchema = z.object({
  projectId: z.string(),
  target: z.string().min(1),
  maxCrawlPages: z.number().min(1).max(1000).default(100),
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
  const { projectId, target, maxCrawlPages } = parsed.data;

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
    const task: any = await client.onPageTaskPost({
      target,
      max_crawl_pages: maxCrawlPages,
    });

    const taskId = task?.tasks?.[0]?.id;
    if (!taskId) {
      throw new Error("DataForSEO did not return a crawl task id.");
    }

    const audit = await prisma.siteAudit.create({
      data: {
        projectId,
        target,
        dataForSeoTaskId: taskId,
        status: "running",
      },
    });

    return NextResponse.json({ audit });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to start site audit" },
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

  const audits = await prisma.siteAudit.findMany({
    where: { projectId },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ audits });
}
