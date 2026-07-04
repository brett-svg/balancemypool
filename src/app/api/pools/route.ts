import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** List all pools (for the switcher). No auth — this is a personal tool. */
export async function GET() {
  const pools = await prisma.pool.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ pools });
}
