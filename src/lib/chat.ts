import type { Analysis, PoolProfile, Reading } from "@/lib/chemistry/types";

/**
 * System prompt for the context-aware expert chat. The golden rule: the
 * deterministic engine owns all dose NUMBERS. The chat explains, teaches, and
 * advises, but when it states a quantity for THIS pool it must use the figures
 * already computed below — never invent new math — so chat and the
 * recommendations screen can never contradict each other.
 */
export function buildSystemPrompt(
  pool: PoolProfile,
  reading: Reading | null,
  analysis: Analysis | null,
): string {
  const chem = pool.chemicals;
  const profile = [
    `Active pool: ${pool.name}`,
    `Volume: ${pool.volumeGallons.toLocaleString()} US gallons`,
    `Surface: ${pool.surface}`,
    `Sanitizer: chlorine`,
    `Chlorine product: ${chem.chlorine.type} (${chem.chlorine.percent}%)`,
    `Acid: ${chem.acid.type} (${chem.acid.percent}%)`,
  ].join("\n");

  let latest = "No test has been recorded yet for this pool. If asked for specific doses, ask the user to run a strip test first.";
  if (reading && analysis) {
    const measured = Object.entries(reading)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    const recs = analysis.recommendations
      .map((r) => {
        const dose = r.dose ? ` → ${r.dose.amount} ${r.dose.unit} of ${r.dose.product}` : "";
        return `- ${r.label}: measured ${r.measured ?? "n/a"}, ${r.direction}${dose}. ${r.headline}`;
      })
      .join("\n");
    latest = `Latest reading: ${measured || "none"}\nEngine recommendations (AUTHORITATIVE — use these exact numbers):\n${recs}\nOverall: ${analysis.overall}`;
  }

  return `You are the world's most knowledgeable pool-balancing expert — think Trouble Free Pool wisdom in a friendly, plain-spoken guide. You help the user balance real chlorine pools. Keep answers concise and practical.

RULES:
- The dosing engine's numbers below are authoritative. When the user asks how much of something to add to THIS pool, use those exact figures. Do NOT compute your own doses.
- If the user asks about a value not in the latest reading, or there's no reading, say what you'd need.
- Use the CYA-adjusted methodology: the correct Free Chlorine level depends on CYA; the strip's generic "OK" bands are often wrong. Explain this when relevant.
- Nothing lowers CYA or Calcium Hardness except replacing water. Never invent a chemical that does.
- SAFETY: never tell anyone to mix chemicals together; add one at a time, to water, pump running, re-test between. Chlorine + acid = toxic gas. Don't swim until FC is in range and pH is 7.2-7.8.
- Be honest about strip imprecision (especially CYA) and suggest a drop-based test when a value really matters.

--- POOL PROFILE ---
${profile}

--- CURRENT STATE ---
${latest}`;
}
