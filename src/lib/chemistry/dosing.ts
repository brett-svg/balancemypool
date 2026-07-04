import type { Dose, PoolProfile } from "./types";
import {
  BAKING_SODA_OZ_PER_10PPM_TA_10K,
  CACL_OZ_PER_10PPM_CH_10K_AT_77,
  CALHYPO_CH_PER_FC,
  CALHYPO_OZ_PER_PPM_10K,
  CYA_OZ_PER_10PPM_10K,
  DICHLOR_CYA_PER_FC,
  DICHLOR_OZ_PER_PPM_10K,
  liquidChlorineFlOz,
  MURIATIC_FLOZ_PH_0_5_AT_TA100_10K,
  REF_GALLONS,
} from "./chemicals";

const scale = (pool: PoolProfile) => pool.volumeGallons / REF_GALLONS;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Present a fluid-ounce amount in the friendliest unit. */
function volumeDose(flOz: number, extra: Partial<Dose> = {}): Dose {
  if (flOz >= 128) return { product: "", amount: round1(flOz / 128), unit: "gallons", ...extra };
  return { product: "", amount: round1(flOz), unit: "fl oz", ...extra };
}

/** Present a weight-ounce amount in the friendliest unit. */
function weightDose(oz: number, extra: Partial<Dose> = {}): Dose {
  if (oz >= 16) return { product: "", amount: round1(oz / 16), unit: "lb", ...extra };
  return { product: "", amount: round1(oz), unit: "oz (weight)", ...extra };
}

/** Raise Free Chlorine by `deltaPpm`, using whatever chlorine the pool stocks. */
export function doseChlorineUp(pool: PoolProfile, deltaPpm: number): Dose {
  const { chlorine } = pool.chemicals;
  const s = scale(pool);
  if (chlorine.type === "liquid") {
    const flOz = liquidChlorineFlOz(deltaPpm, pool.volumeGallons, chlorine.percent);
    return volumeDose(flOz, { product: `liquid chlorine (${chlorine.percent}%)` });
  }
  if (chlorine.type === "cal-hypo") {
    const oz = CALHYPO_OZ_PER_PPM_10K * deltaPpm * s;
    return weightDose(oz, {
      product: "cal-hypo",
      sideEffects: [`raises calcium hardness ~${Math.round(CALHYPO_CH_PER_FC * deltaPpm)} ppm`],
    });
  }
  const oz = DICHLOR_OZ_PER_PPM_10K * deltaPpm * s;
  return weightDose(oz, {
    product: "dichlor",
    sideEffects: [`raises CYA ~${Math.round(DICHLOR_CYA_PER_FC * deltaPpm)} ppm — watch stabilizer creep`],
  });
}

/**
 * Acid to bring pH down to target. Acid demand is nonlinear and depends on TA,
 * so this is explicitly approximate: anchor on "~25 fl oz of 31.45% muriatic
 * lowers pH 0.5 at TA 100 per 10k gal" and scale by ΔpH, TA, volume, strength.
 */
export function doseAcidForPh(
  pool: PoolProfile,
  currentPh: number,
  targetPh: number,
  ta: number | null,
): Dose {
  const { acid } = pool.chemicals;
  const deltaPh = Math.max(0, currentPh - targetPh);
  const taFactor = (ta ?? 100) / 100;
  const flOz31 = MURIATIC_FLOZ_PH_0_5_AT_TA100_10K * (deltaPh / 0.5) * taFactor * scale(pool);
  const flOz = flOz31 * (31.45 / acid.percent);
  const dose = volumeDose(flOz, {
    product: acid.type === "muriatic" ? `muriatic acid (${acid.percent}%)` : "dry acid",
    approximate: true,
    sideEffects: ["also lowers Total Alkalinity"],
  });
  return dose;
}

/** Raise Total Alkalinity by `deltaPpm` with baking soda. */
export function doseAlkalinityUp(pool: PoolProfile, deltaPpm: number): Dose {
  const oz = BAKING_SODA_OZ_PER_10PPM_TA_10K * (deltaPpm / 10) * scale(pool);
  return weightDose(oz, { product: "baking soda (sodium bicarbonate)" });
}

/** Raise Cyanuric Acid by `deltaPpm` with granular stabilizer. */
export function doseCyaUp(pool: PoolProfile, deltaPpm: number): Dose {
  const oz = CYA_OZ_PER_10PPM_10K * (deltaPpm / 10) * scale(pool);
  return weightDose(oz, {
    product: "cyanuric acid (stabilizer)",
    approximate: true,
    sideEffects: ["dissolves slowly — re-test in ~1 week before adding more"],
  });
}

/** Raise Calcium Hardness by `deltaPpm` with calcium chloride. */
export function doseCalciumUp(pool: PoolProfile, deltaPpm: number): Dose {
  const { calciumUp } = pool.chemicals;
  const oz = CACL_OZ_PER_10PPM_CH_10K_AT_77 * (deltaPpm / 10) * scale(pool) * (77 / calciumUp.percent);
  return weightDose(oz, { product: `calcium chloride (${calciumUp.percent}%)` });
}

/**
 * There is no chemical that lowers CYA, CH, or (practically) high FC — the only
 * real fix is diluting with fresh water. Returns the approximate fraction of
 * water to replace to bring `current` down to `target`.
 */
export function dilutionAdvice(current: number, target: number, gallons: number) {
  const fraction = current > 0 ? Math.max(0, 1 - target / current) : 0;
  return {
    fractionPct: Math.round(fraction * 100),
    gallons: Math.round(fraction * gallons),
  };
}
