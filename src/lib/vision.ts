import { openai, VISION_MODEL } from "@/lib/openai";
import type { StripDefinition } from "@/lib/strips/types";
import type { Reading } from "@/lib/chemistry/types";

export type Confidence = "high" | "medium" | "low";
export interface StripReadResult {
  values: Reading;
  confidence: Partial<Record<string, Confidence>>;
  modelNotes: string;
}

/** Describe each pad (its printed values + reference swatch colors) so the model matches accurately. */
function padGuide(strip: StripDefinition): string {
  return strip.pads
    .map((p, i) => {
      const scale = p.breakpoints.map((b, j) => `${b}${p.unit ? " " + p.unit : ""}=${p.swatches[j]}`).join(", ");
      return `${i + 1}. ${p.label} (key: ${p.key}${p.unit ? ", " + p.unit : ""}) — printed scale low→high: ${scale}`;
    })
    .join("\n");
}

/** JSON schema constrained to this strip's exact pad keys. */
function responseSchema(strip: StripDefinition) {
  const properties: Record<string, unknown> = {};
  for (const p of strip.pads) {
    properties[p.key] = {
      type: "object",
      additionalProperties: false,
      properties: {
        value: { type: ["number", "null"], description: `${p.label} reading, or null if unreadable` },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
      },
      required: ["value", "confidence"],
    };
  }
  return {
    type: "object" as const,
    additionalProperties: false,
    properties: { ...properties, notes: { type: "string" } },
    required: [...strip.pads.map((p) => p.key), "notes"],
  };
}

const SYSTEM = `You read pool/spa test strips from photos. You are given the strip's printed color chart (each pad's value scale and the reference hex color for each swatch). For EACH pad:
- Compare the pad's color in the photo to that pad's reference swatches.
- Return the value of the closest swatch. If the color sits clearly between two swatches, you may return an interpolated value.
- If a pad is washed out by glare, out of frame, unstained, or you genuinely cannot tell, return null and confidence "low". Never guess a plausible-looking number.
- Confidence: "high" only when the match is unambiguous; "medium" when between swatches or lighting is imperfect; "low" when unsure.
Colors shift with lighting/white balance — account for that, and prefer null over a confident wrong answer, especially for chlorine.`;

/** Read a strip photo (base64 data URL) into structured values. */
export async function readStrip(strip: StripDefinition, imageDataUrl: string): Promise<StripReadResult> {
  const completion = await openai.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Strip: ${strip.name}\nPads (top to bottom on the strip) and their printed color scales:\n${padGuide(
              strip,
            )}\n\nRead every pad from the photo and return the JSON.`,
          },
          { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "strip_reading", strict: true, schema: responseSchema(strip) },
    },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Record<string, { value: number | null; confidence: Confidence } | string>;

  const values: Reading = {};
  const confidence: Partial<Record<string, Confidence>> = {};
  for (const p of strip.pads) {
    const cell = parsed[p.key] as { value: number | null; confidence: Confidence } | undefined;
    values[p.key] = cell?.value ?? null;
    confidence[p.key] = cell?.confidence ?? "low";
  }
  return { values, confidence, modelNotes: typeof parsed.notes === "string" ? parsed.notes : "" };
}
