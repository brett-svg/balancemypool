import type { ParamKey } from "@/lib/strips/types";
import type { PoolProfile, Reading, Surface, TargetRange } from "./types";

// Target model = the "brain". It follows the Trouble Free Pool / CYA-adjusted
// methodology rather than the strip's simplistic printed "OK" bands. The single
// most important rule: the correct Free Chlorine level is NOT a fixed number —
// it scales with CYA. A stabilized pool needs more chlorine to stay sanitary.

const round05 = (n: number) => Math.round(n * 2) / 2;

/**
 * CYA-adjusted Free Chlorine target for a non-SWG chlorine pool.
 * Minimum FC ~= 7.5% of CYA (below this, algae risk); target band sits above it.
 * With no/low CYA, chlorine burns off fast in sun — hold a modest FC and push
 * the user to add stabilizer.
 */
export function fcTarget(cya: number | null | undefined): TargetRange {
  const c = cya ?? 0;
  if (c < 20) {
    return {
      key: "freeChlorine",
      aim: 3,
      low: 2,
      high: 4,
      basis:
        "CYA is very low, so chlorine burns off fast in sunlight — hold FC 2-4 and add stabilizer to 30-50 ppm to make chlorine last.",
    };
  }
  const min = round05(0.075 * c); // TFP minimum
  const aim = round05(0.12 * c); // comfortable target
  const high = round05(0.15 * c); // upper end of normal (well below SLAM levels)
  return {
    key: "freeChlorine",
    aim,
    low: Math.max(min, 2),
    high: Math.max(high, aim + 1),
    basis: `CYA-adjusted: at CYA ~${c} ppm you need roughly FC ${Math.max(min, 2)}-${Math.max(high, aim + 1)} ppm (min ~7.5% of CYA). The strip's generic "OK" band ignores CYA.`,
  };
}

function chTarget(surface: Surface): TargetRange {
  if (surface === "plaster") {
    return {
      key: "totalHardness",
      aim: 350,
      low: 250,
      high: 450,
      basis: "Plaster/gunite needs calcium in the water or it leaches from the surface.",
    };
  }
  return {
    key: "totalHardness",
    aim: 250,
    low: 150,
    high: 350,
    basis: `${surface} has no plaster to protect, so calcium hardness is low-priority; just avoid extremes.`,
  };
}

/** All target ranges for a pool, given its current CYA (which drives FC). */
export function targetsFor(pool: PoolProfile, reading: Reading): Partial<Record<ParamKey, TargetRange>> {
  return {
    freeChlorine: fcTarget(reading.cya),
    ph: { key: "ph", aim: 7.6, low: 7.4, high: 7.8, basis: "Comfort + scale/corrosion balance." },
    totalAlkalinity: {
      key: "totalAlkalinity",
      aim: 70,
      low: 60,
      high: 90,
      basis: "Buffers pH. Lower end (60-70) suits liquid-chlorine pools whose pH tends to drift up.",
    },
    cya: {
      key: "cya",
      aim: 40,
      low: 30,
      high: 50,
      basis: "Outdoor chlorine pool: 30-50 protects chlorine from UV without over-suppressing it.",
    },
    totalHardness: chTarget(pool.surface),
  };
}
