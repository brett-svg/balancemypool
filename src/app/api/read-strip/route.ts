import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStrip } from "@/lib/strips";
import { readStrip } from "@/lib/vision";
import { assertOpenAIConfigured } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60; // vision reads can take a few seconds

const Body = z.object({
  poolId: z.string().min(1),
  imageDataUrl: z.string().startsWith("data:image/"),
});

export async function POST(req: NextRequest) {
  try {
    assertOpenAIConfigured();
    const { poolId, imageDataUrl } = Body.parse(await req.json());

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    const strip = getStrip(pool.stripId);
    const result = await readStrip(strip, imageDataUrl);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read strip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
