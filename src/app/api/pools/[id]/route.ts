import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyze } from "@/lib/chemistry/analyze";
import { toProfile, toReading } from "@/lib/pools";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** Get one pool + its latest reading and freshly-computed analysis. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const pool = await prisma.pool.findUnique({
    where: { id },
    include: { readings: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  const latest = pool.readings[0] ?? null;
  const analysis = latest ? analyze(toProfile(pool), toReading(latest)) : null;
  return NextResponse.json({ pool, latestReading: latest, analysis });
}

const ChemicalSet = z.object({
  chlorine: z.object({ type: z.enum(["liquid", "cal-hypo", "dichlor"]), percent: z.number().positive() }),
  acid: z.object({ type: z.enum(["muriatic", "dry-acid"]), percent: z.number().positive() }),
  alkalinityUp: z.object({ type: z.literal("baking-soda") }),
  cyaUp: z.object({ type: z.literal("cyanuric-acid") }),
  calciumUp: z.object({ type: z.literal("calcium-chloride"), percent: z.number().positive() }),
});

const Patch = z.object({
  name: z.string().min(1).optional(),
  volumeGallons: z.number().int().positive().optional(),
  surface: z.enum(["plaster", "vinyl", "fiberglass"]).optional(),
  stripId: z.string().optional(),
  chemicals: ChemicalSet.optional(),
});

/** Update a pool profile (volume, surface, chemical set, etc.). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const data = Patch.parse(await req.json());
    const pool = await prisma.pool.update({
      where: { id },
      data: { ...data, chemicals: data.chemicals as object | undefined },
    });
    return NextResponse.json({ pool });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
