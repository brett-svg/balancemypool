import type { ParamKey } from "@/lib/strips/types";

export type Surface = "plaster" | "vinyl" | "fiberglass";

/** Which product a pool stocks for each corrective direction. Editable per pool. */
export interface ChemicalSet {
  /** Raises Free Chlorine. */
  chlorine: { type: "liquid" | "cal-hypo" | "dichlor"; percent: number };
  /** Lowers pH and Total Alkalinity. */
  acid: { type: "muriatic" | "dry-acid"; percent: number };
  /** Raises Total Alkalinity (baking soda). */
  alkalinityUp: { type: "baking-soda" };
  /** Raises Cyanuric Acid (stabilizer). */
  cyaUp: { type: "cyanuric-acid" };
  /** Raises Calcium Hardness. */
  calciumUp: { type: "calcium-chloride"; percent: number };
}

export interface PoolProfile {
  id: string;
  name: string;
  volumeGallons: number;
  surface: Surface;
  stripId: string;
  chemicals: ChemicalSet;
}

/** A set of measured values from one test. Any pad may be unreadable (null). */
export type Reading = Partial<Record<ParamKey, number | null>>;

export interface TargetRange {
  key: ParamKey;
  /** Ideal value to aim for. */
  aim: number;
  /** Acceptable band [low, high]; inside this we take no action. */
  low: number;
  high: number;
  /** Human note about how the target was derived (e.g. CYA-adjusted FC). */
  basis?: string;
}

export interface Dose {
  /** Product to add, in plain language. */
  product: string;
  /** Amount, already scaled to the pool's volume. */
  amount: number;
  unit: "fl oz" | "oz (weight)" | "lb" | "cups" | "gallons";
  /** Secondary effects the user must know (e.g. dichlor raises CYA). */
  sideEffects?: string[];
  /** True when the amount is inherently approximate and needs a re-test. */
  approximate?: boolean;
}

export type Direction = "raise" | "lower" | "ok" | "cannot-lower" | "info";

export interface Recommendation {
  key: ParamKey;
  label: string;
  unit: string;
  /** What the strip read (may be a coarse estimate). */
  measured: number | null;
  /** The strip's own printed "OK" verdict, for the transparent comparison. */
  stripSaysOk: boolean | null;
  target: TargetRange | null;
  direction: Direction;
  /** Priority for display/action order; lower = more urgent. */
  priority: number;
  /** One-line expert summary. */
  headline: string;
  /** The transparent-mode explanation, incl. any strip-vs-target discrepancy. */
  explanation: string;
  dose?: Dose;
  /** True when the strip can't resolve this precisely (show a range, urge better test). */
  lowConfidence?: boolean;
}

export interface Analysis {
  poolId: string;
  overall: string;
  recommendations: Recommendation[];
  /** Cross-cutting notes (combined chlorine, bromine present, safety). */
  notes: string[];
  safety: string[];
}
