import type { ChemicalSet } from "./types";

// Dosing constants below are the widely-published pool-chemistry factors (the
// same ones PoolMath / Trouble Free Pool use), expressed PER 10,000 US GALLONS
// and then scaled by actual volume in dosing.ts. They are approximations — real
// water varies — so every dose is presented as a starting point followed by a
// re-test, and pH especially is flagged `approximate`.

export const REF_GALLONS = 10_000;

/** Standard, editable kit. Cleanest side effects: liquid chlorine + muriatic. */
export const STANDARD_CHEMICALS: ChemicalSet = {
  chlorine: { type: "liquid", percent: 10 },
  acid: { type: "muriatic", percent: 31.45 },
  alkalinityUp: { type: "baking-soda" },
  cyaUp: { type: "cyanuric-acid" },
  calciumUp: { type: "calcium-chloride", percent: 77 },
};

// ---- Free Chlorine -------------------------------------------------------
// Liquid chlorine (sodium hypochlorite): ~10.7 fl oz of 12.5% raises FC by
// 1 ppm per 10k gal. Scales inversely with trade %.
export const LIQUID_CL_FLOZ_PER_PPM_10K_AT_12_5 = 10.7;
// Cal-hypo 73%: ~1.5 oz-wt per ppm per 10k; also raises CH ~0.7 ppm per FC ppm.
export const CALHYPO_OZ_PER_PPM_10K = 1.5;
export const CALHYPO_CH_PER_FC = 0.7;
// Dichlor 56%: ~2.0 oz-wt per ppm per 10k; also raises CYA ~0.9 ppm per FC ppm.
export const DICHLOR_OZ_PER_PPM_10K = 2.0;
export const DICHLOR_CYA_PER_FC = 0.9;

// ---- Acid (lower pH / TA) ------------------------------------------------
// Muriatic acid 31.45%: ~25 fl oz lowers pH 0.5 at TA 100 per 10k gal, and
// lowers TA ~ proportionally. Dry acid (sodium bisulfate) ~1.5x the weight.
export const MURIATIC_FLOZ_PH_0_5_AT_TA100_10K = 25;
export const MURIATIC_FLOZ_PER_10PPM_TA_10K = 25.6;

// ---- Total Alkalinity up (baking soda) -----------------------------------
// ~1.5 lb (24 oz-wt) raises TA 10 ppm per 10k gal. Negligible pH effect.
export const BAKING_SODA_OZ_PER_10PPM_TA_10K = 24;

// ---- Cyanuric Acid up (stabilizer) ---------------------------------------
// ~13 oz-wt raises CYA 10 ppm per 10k gal. Dissolves slowly; re-test in a week.
export const CYA_OZ_PER_10PPM_10K = 13;

// ---- Calcium Hardness up (calcium chloride) ------------------------------
// ~1.25 lb (20 oz-wt) of 77% dihydrate raises CH 10 ppm per 10k gal.
export const CACL_OZ_PER_10PPM_CH_10K_AT_77 = 20;

/** fl oz of liquid chlorine to raise FC by `ppm` in `gallons`, given trade %. */
export function liquidChlorineFlOz(ppm: number, gallons: number, percent: number): number {
  const factor = LIQUID_CL_FLOZ_PER_PPM_10K_AT_12_5 * (12.5 / percent);
  return factor * ppm * (gallons / REF_GALLONS);
}
