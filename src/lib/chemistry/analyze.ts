import { getStrip } from "@/lib/strips";
import type { StripPad } from "@/lib/strips/types";
import {
  dilutionAdvice,
  doseAcidForPh,
  doseAlkalinityUp,
  doseCalciumUp,
  doseChlorineUp,
  doseCyaUp,
} from "./dosing";
import { targetsFor } from "./targets";
import type { Analysis, PoolProfile, Reading, Recommendation, TargetRange } from "./types";

const SAFETY = [
  "Add chemicals TO the water (never water to chemical), one at a time, in different areas of the pool, with the pump running — wait ~30 min and re-test between additions.",
  "NEVER mix pool chemicals together or store them touching. Chlorine + acid releases toxic gas.",
  "Don't swim until Free Chlorine is in range and pH is 7.2-7.8.",
];

const inBand = (v: number, low: number, high: number) => v >= low && v <= high;
const stripOk = (pad: StripPad, v: number | null): boolean | null =>
  v == null || !pad.okBand ? null : inBand(v, pad.okBand[0], pad.okBand[1]);

/** Free Chlorine — the CYA-adjusted, safety-critical parameter. */
function analyzeFC(pool: PoolProfile, r: Reading, pad: StripPad, t: TargetRange): Recommendation {
  const v = r.freeChlorine ?? null;
  const base = {
    key: "freeChlorine" as const,
    label: pad.label,
    unit: pad.unit,
    measured: v,
    stripSaysOk: stripOk(pad, v),
    target: t,
    priority: 1,
    lowConfidence: r.cya == null, // FC target is only as trustworthy as the CYA reading
  };
  if (v == null)
    return { ...base, direction: "info", headline: "Couldn't read Free Chlorine", explanation: "Re-take the photo or enter it manually — chlorine is the one value you never want to guess on." };

  if (v < t.low) {
    const dose = doseChlorineUp(pool, t.aim - v);
    const stripNote =
      base.stripSaysOk === true
        ? ` Your strip marks FC ${v} as "OK" (its band is ${pad.okBand?.[0]}-${pad.okBand?.[1]}), but that band ignores stabilizer — this is exactly the case where the strip misleads you.`
        : "";
    return {
      ...base,
      direction: "raise",
      headline: `Raise Free Chlorine to ~${t.aim} ppm`,
      explanation: `${t.basis}${stripNote} Add ~${dose.amount} ${dose.unit} of ${dose.product}, run the pump, and re-test.`,
      dose,
    };
  }
  if (v > t.high) {
    return {
      ...base,
      direction: "cannot-lower",
      headline: "Free Chlorine is high — just wait",
      explanation: `FC ${v} is above your target ${t.low}-${t.high}. There's no need to add anything; sunlight will bring it down in a day or two. Don't swim until it's below ~${Math.round(t.high + 2)} ppm.`,
    };
  }
  return { ...base, direction: "ok", headline: "Free Chlorine is on target", explanation: t.basis ?? "" };
}

function analyzePH(pool: PoolProfile, r: Reading, pad: StripPad, t: TargetRange): Recommendation {
  const v = r.ph ?? null;
  const base = { key: "ph" as const, label: pad.label, unit: pad.unit, measured: v, stripSaysOk: stripOk(pad, v), target: t, priority: 2 };
  if (v == null) return { ...base, direction: "info", headline: "Couldn't read pH", explanation: "Re-take the photo or enter it manually." };
  if (v > t.high) {
    const dose = doseAcidForPh(pool, v, t.aim, r.totalAlkalinity ?? null);
    return { ...base, direction: "lower", headline: `Lower pH to ~${t.aim}`, explanation: `pH ${v} is high (target ${t.low}-${t.high}). Add ~${dose.amount} ${dose.unit} of ${dose.product} — this is a starting estimate (acid demand depends on alkalinity), so add ~75% of it, re-test in 30 min, and repeat if needed. It will also nudge Total Alkalinity down.`, dose };
  }
  if (v < t.low) {
    return { ...base, direction: "raise", headline: "Raise pH", explanation: `pH ${v} is low (target ${t.low}-${t.high}). The cleanest fix with your kit is aeration — run returns/spa jets pointed up, or a fountain, for a few hours. If Total Alkalinity is also low, adding baking soda will raise both.` };
  }
  return { ...base, direction: "ok", headline: "pH is on target", explanation: t.basis ?? "" };
}

function analyzeTA(pool: PoolProfile, r: Reading, pad: StripPad, t: TargetRange): Recommendation {
  const v = r.totalAlkalinity ?? null;
  const base = { key: "totalAlkalinity" as const, label: pad.label, unit: pad.unit, measured: v, stripSaysOk: stripOk(pad, v), target: t, priority: 3 };
  if (v == null) return { ...base, direction: "info", headline: "Couldn't read Total Alkalinity", explanation: "Re-take the photo or enter it manually." };
  if (v < t.low) {
    const dose = doseAlkalinityUp(pool, t.aim - v);
    return { ...base, direction: "raise", headline: `Raise Total Alkalinity to ~${t.aim} ppm`, explanation: `TA ${v} is low (target ${t.low}-${t.high}); low TA lets pH bounce around. Add ~${dose.amount} ${dose.unit} of ${dose.product}, brush to dissolve, re-test in a few hours.`, dose };
  }
  if (v > t.high) {
    return { ...base, direction: "lower", headline: "Lower Total Alkalinity", explanation: `TA ${v} is high (target ${t.low}-${t.high}), which will keep pushing pH up. Lower it gradually: add acid to bring pH down to ~7.2, then aerate to raise pH back to ~7.6 without raising TA. Repeat over a few days. (Your pH recommendation already accounts for the acid.)` };
  }
  return { ...base, direction: "ok", headline: "Total Alkalinity is on target", explanation: t.basis ?? "" };
}

function analyzeCYA(pool: PoolProfile, r: Reading, pad: StripPad, t: TargetRange): Recommendation {
  const v = r.cya ?? null;
  const base = { key: "cya" as const, label: pad.label, unit: pad.unit, measured: v, stripSaysOk: stripOk(pad, v), target: t, priority: 4, lowConfidence: true };
  const coarse = " Note: strips read CYA in wide buckets and can't tell 30 from 50 — and since CYA sets your chlorine target, it's worth confirming with a drop-based CYA test or a pool-store test.";
  if (v == null) return { ...base, direction: "info", headline: "Couldn't read Cyanuric Acid", explanation: `Re-take the photo or enter it manually.${coarse}` };
  if (v < t.low) {
    const dose = doseCyaUp(pool, t.aim - v);
    return { ...base, direction: "raise", headline: `Raise CYA to ~${t.aim} ppm`, explanation: `CYA ${v} is low (target ${t.low}-${t.high}); without stabilizer, sun destroys your chlorine within hours. Add ~${dose.amount} ${dose.unit} of ${dose.product} (sock in the skimmer, don't backwash for a few days).${coarse}`, dose };
  }
  if (v > t.high) {
    const dil = dilutionAdvice(v, t.aim, pool.volumeGallons);
    const strong = v >= 80;
    return { ...base, direction: "cannot-lower", headline: strong ? "CYA is too high — dilute" : "CYA is a bit high", explanation: `CYA ${v} is above ${t.high}. Nothing removes CYA except replacing water. ${strong ? `Drain and refill ~${dil.fractionPct}% (~${dil.gallons.toLocaleString()} gal) to get near ${t.aim}. ` : "It's only slightly high — you can let rain/splash-out dilute it over time. "}Meanwhile your Free Chlorine target rises with CYA, so keep chlorine up.${coarse}` };
  }
  return { ...base, direction: "ok", headline: "CYA is on target", explanation: `${t.basis ?? ""}${coarse}` };
}

function analyzeCH(pool: PoolProfile, r: Reading, pad: StripPad, t: TargetRange): Recommendation {
  const v = r.totalHardness ?? null;
  const lowPriority = pool.surface !== "plaster";
  const base = { key: "totalHardness" as const, label: pad.label, unit: pad.unit, measured: v, stripSaysOk: stripOk(pad, v), target: t, priority: 5 };
  if (v == null) return { ...base, direction: "info", headline: "Couldn't read Total Hardness", explanation: "Re-take the photo or enter it manually." };
  if (v < t.low) {
    const dose = doseCalciumUp(pool, t.aim - v);
    return { ...base, direction: "raise", headline: `Raise Calcium Hardness to ~${t.aim} ppm`, explanation: `CH ${v} is low (target ${t.low}-${t.high}).${lowPriority ? " On your surface this is low-priority, so only bother if it's very low." : " On plaster, low calcium is corrosive to the surface."} Add ~${dose.amount} ${dose.unit} of ${dose.product}.`, dose };
  }
  if (v > t.high) {
    const dil = dilutionAdvice(v, t.aim, pool.volumeGallons);
    return { ...base, direction: "cannot-lower", headline: "Calcium Hardness is high", explanation: `CH ${v} is above ${t.high}; only dilution removes calcium (replace ~${dil.fractionPct}% of the water if it's causing scale). Otherwise keep pH toward the low end (7.4-7.6) and TA ~60-70 to avoid cloudy scaling.` };
  }
  return { ...base, direction: "ok", headline: "Calcium Hardness is on target", explanation: t.basis ?? "" };
}

/** Full transparent-expert analysis for one reading. Deterministic — the engine owns every number. */
export function analyze(pool: PoolProfile, reading: Reading): Analysis {
  const strip = getStrip(pool.stripId);
  const t = targetsFor(pool, reading);
  const padOf = (k: string) => strip.pads.find((p) => p.key === k)!;

  const recs: Recommendation[] = [
    analyzeFC(pool, reading, padOf("freeChlorine"), t.freeChlorine!),
    analyzePH(pool, reading, padOf("ph"), t.ph!),
    analyzeTA(pool, reading, padOf("totalAlkalinity"), t.totalAlkalinity!),
    analyzeCYA(pool, reading, padOf("cya"), t.cya!),
    analyzeCH(pool, reading, padOf("totalHardness"), t.totalHardness!),
  ].sort((a, b) => a.priority - b.priority);

  const notes: string[] = [];
  const safety = [...SAFETY];

  // Combined chlorine (chloramines) = Total - Free. High CC means sanitation is lagging.
  const fc = reading.freeChlorine;
  const tc = reading.totalChlorine;
  if (fc != null && tc != null) {
    const cc = Math.max(0, tc - fc);
    if (cc >= 0.5) {
      notes.push(`Combined chlorine (chloramines) ≈ ${cc.toFixed(1)} ppm — that "pool smell" and eye irritation. Your sanitizer is behind. Raise Free Chlorine and hold it high until combined chlorine reads ~0.`);
      safety.push("Elevated combined chlorine: don't swim until Free Chlorine is holding steady and combined chlorine is near 0.");
    }
  }
  if ((reading.bromine ?? 0) > 2) {
    notes.push(`The bromine pad is reading ~${reading.bromine} ppm. These are chlorine pools, so that's usually just cross-reaction, not real bromine — safe to ignore unless you actually dose bromine.`);
  }

  const problems = recs.filter((r) => r.direction === "raise" || r.direction === "lower" || r.direction === "cannot-lower");
  const overall =
    problems.length === 0
      ? "Everything's in range — your pool is balanced. Keep chlorine up and re-test in a few days."
      : `${problems.length} thing${problems.length > 1 ? "s" : ""} to address. Work top-down: chlorine and pH first, then the rest. Add one chemical at a time and re-test.`;

  return { poolId: pool.id, overall, recommendations: recs, notes, safety };
}
