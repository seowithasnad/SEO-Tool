import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/server/db/client";

const createSchema = z.object({
  projectId: z.string(),
  keyword: z.string().min(1),
  country: z.string(),
  language: z.string(),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
  targetUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const keywords = await prisma.trackedKeyword.findMany({
    where: { projectId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      snapshots: {
        orderBy: { capturedAt: "desc" },
        take: 30,
      },
    },
  });

  return NextResponse.json({ keywords });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tracked = await prisma.trackedKeyword.create({
    data: parsed.data,
  });

  return NextResponse.json({ keyword: tracked });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.trackedKeyword.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
