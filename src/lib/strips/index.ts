import type { StripDefinition } from "./types";
import { EASYTEST_7IN1 } from "./easytest";

export * from "./types";

/** Registry of known strips. Add a new brand here — nothing else changes. */
export const STRIPS: Record<string, StripDefinition> = {
  [EASYTEST_7IN1.id]: EASYTEST_7IN1,
};

export const DEFAULT_STRIP_ID = EASYTEST_7IN1.id;

export function getStrip(id: string | null | undefined): StripDefinition {
  return STRIPS[id ?? DEFAULT_STRIP_ID] ?? EASYTEST_7IN1;
}
