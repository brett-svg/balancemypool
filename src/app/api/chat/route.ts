import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertOpenAIConfigured, CHAT_MODEL, openai } from "@/lib/openai";
import { analyze } from "@/lib/chemistry/analyze";
import { buildSystemPrompt } from "@/lib/chat";
import { toProfile, toReading } from "@/lib/pools";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  poolId: z.string().min(1),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    assertOpenAIConfigured();
    const { poolId, messages } = Body.parse(await req.json());

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: { readings: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    const profile = toProfile(pool);
    const latest = pool.readings[0] ?? null;
    const reading = latest ? toReading(latest) : null;
    const analysis = reading ? analyze(profile, reading) : null;
    const system = buildSystemPrompt(profile, reading, analysis);

    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch {
          controller.enqueue(encoder.encode("\n\n[stream interrupted]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
