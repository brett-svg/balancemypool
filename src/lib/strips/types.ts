// A "strip definition" makes a physical test strip into swappable DATA, not code.
// Adding a new brand later (e.g. whatever Lynn's pool ends up using) is a new
// object in the registry — never a change to the reading or chemistry logic.

/** Canonical parameter keys the whole app speaks in. */
export type ParamKey =
  | "totalHardness"
  | "freeChlorine"
  | "bromine"
  | "totalChlorine"
  | "cya"
  | "totalAlkalinity"
  | "ph";

export interface StripPad {
  /** Canonical parameter this pad measures. */
  key: ParamKey;
  /** Human label exactly as printed on the bottle. */
  label: string;
  /** Unit as printed ("ppm", or "" for pH). */
  unit: string;
  /**
   * The value breakpoints printed under the color swatches, low -> high.
   * These are the ONLY values the strip can resolve; anything between two
   * breakpoints is an estimate. Coarseness here is why we show ranges, not
   * false precision, downstream.
   */
  breakpoints: number[];
  /**
   * Hex reference colors aligned 1:1 with `breakpoints`. Given to the vision
   * model as ground truth so it matches a pad to the nearest printed swatch.
   */
  swatches: string[];
  /** Whether this pad drives balancing advice or is informational only. */
  role: "actionable" | "informational";
  /**
   * The strip's OWN printed "OK" band [low, high], as marked on the bottle.
   * We show this next to our CYA-adjusted verdict so the user sees exactly
   * where the strip's label and real pool chemistry disagree.
   */
  okBand?: [number, number];
}

export interface StripDefinition {
  id: string;
  name: string;
  /** Order matters: pads are listed top-to-bottom as they appear on the strip. */
  pads: StripPad[];
}
