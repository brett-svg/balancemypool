import type { Pool as DbPool, Reading as DbReading } from "@/generated/prisma";
import { STANDARD_CHEMICALS } from "@/lib/chemistry/chemicals";
import type { ChemicalSet, PoolProfile, Reading, Surface } from "@/lib/chemistry/types";
import type { ParamKey } from "@/lib/strips/types";

/** Convert a DB Pool row into the engine's PoolProfile (chemicals is stored as Json). */
export function toProfile(p: DbPool): PoolProfile {
  return {
    id: p.id,
    name: p.name,
    volumeGallons: p.volumeGallons,
    surface: p.surface as Surface,
    stripId: p.stripId,
    chemicals: (p.chemicals as unknown as ChemicalSet) ?? STANDARD_CHEMICALS,
  };
}

const PARAM_KEYS: ParamKey[] = [
  "totalHardness",
  "freeChlorine",
  "bromine",
  "totalChlorine",
  "cya",
  "totalAlkalinity",
  "ph",
];

/** Pull just the measured values out of a DB Reading row. */
export function toReading(r: DbReading): Reading {
  const out: Reading = {};
  for (const k of PARAM_KEYS) out[k] = (r[k] as number | null) ?? null;
  return out;
}
