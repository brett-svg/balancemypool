"use client";

import { useState } from "react";
import { getStrip } from "@/lib/strips";
import type { ReadConfidence, ReadValues } from "@/lib/dto";

const CONF_BADGE: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  low: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

export default function ReviewForm({
  stripId,
  initial,
  confidence,
  modelNotes,
  onSave,
  onCancel,
  saving,
}: {
  stripId: string;
  initial: ReadValues;
  confidence: ReadConfidence;
  modelNotes?: string;
  onSave: (values: ReadValues) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const strip = getStrip(stripId);
  const [values, setValues] = useState<ReadValues>(initial);

  const set = (key: string, raw: string) => {
    setValues((v) => ({ ...v, [key]: raw === "" ? null : Number(raw) }));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-cyan-50 p-3 text-sm text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100">
        Check each value against the strip in your hand and fix anything that looks off, then save.
        {modelNotes ? <div className="mt-1 opacity-80">Reader notes: {modelNotes}</div> : null}
      </div>

      {strip.pads.map((pad) => {
        const conf = confidence[pad.key];
        return (
          <div key={pad.key} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <label className="font-medium" htmlFor={`pad-${pad.key}`}>
                {pad.label} {pad.unit && <span className="opacity-60">({pad.unit})</span>}
                {pad.role === "informational" && <span className="ml-1 text-xs opacity-50">· info only</span>}
              </label>
              {conf && <span className={`rounded px-2 py-0.5 text-xs font-semibold ${CONF_BADGE[conf]}`}>{conf}</span>}
            </div>
            <input
              id={`pad-${pad.key}`}
              type="number"
              inputMode="decimal"
              step="any"
              value={values[pad.key] ?? ""}
              onChange={(e) => set(pad.key, e.target.value)}
              placeholder="unreadable — leave blank"
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg dark:border-zinc-700 dark:bg-zinc-950"
            />
            <div className="mt-1 text-xs opacity-60">Strip scale: {pad.breakpoints.join(" · ")}</div>
          </div>
        );
      })}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(values)}
          disabled={saving}
          className="flex-1 rounded-xl bg-cyan-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Analyzing…" : "Save & get advice"}
        </button>
        <button onClick={onCancel} className="rounded-xl border border-zinc-300 px-4 font-medium dark:border-zinc-700">
          Cancel
        </button>
      </div>
    </div>
  );
}
