import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyze } from "@/lib/chemistry/analyze";
import { toProfile } from "@/lib/pools";
import type { Reading } from "@/lib/chemistry/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const num = z.number().nullable().optional();
const Body = z.object({
  freeChlorine: num,
  totalChlorine: num,
  bromine: num,
  ph: num,
  totalAlkalinity: num,
  cya: num,
  totalHardness: num,
  source: z.enum(["strip-photo", "manual"]).default("strip-photo"),
  note: z.string().optional(),
});

/** Save a confirmed reading, run the deterministic engine, persist the analysis snapshot. */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const pool = await prisma.pool.findUnique({ where: { id } });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    const body = Body.parse(await req.json());
    const reading: Reading = {
      freeChlorine: body.freeChlorine ?? null,
      totalChlorine: body.totalChlorine ?? null,
      bromine: body.bromine ?? null,
      ph: body.ph ?? null,
      totalAlkalinity: body.totalAlkalinity ?? null,
      cya: body.cya ?? null,
      totalHardness: body.totalHardness ?? null,
    };

    const analysis = analyze(toProfile(pool), reading);

    const saved = await prisma.reading.create({
      data: {
        poolId: id,
        ...reading,
        source: body.source,
        note: body.note,
        recommendation: analysis as unknown as object,
      },
    });

    return NextResponse.json({ reading: saved, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save reading";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Reading history for a pool (stored in v1; analytics UI is v2). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const readings = await prisma.reading.findMany({
    where: { poolId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ readings });
}
