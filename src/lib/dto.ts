import type { ChemicalSet, Surface } from "@/lib/chemistry/types";

/** Client-side shape of a pool (chemicals comes back from the API as JSON). */
export interface PoolDTO {
  id: string;
  name: string;
  volumeGallons: number;
  surface: Surface;
  sanitizer: string;
  stripId: string;
  chemicals: ChemicalSet;
}

/** Values the vision model returned, before the user confirms them. */
export type ReadValues = Partial<Record<string, number | null>>;
export type ReadConfidence = Partial<Record<string, "high" | "medium" | "low">>;
