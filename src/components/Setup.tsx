"use client";

import { useState } from "react";
import type { PoolDTO } from "@/lib/dto";
import type { ChemicalSet, Surface } from "@/lib/chemistry/types";

/** Rectangular estimate: surface area (ft²) × average depth (ft) × 7.48 gal/ft³. */
function estimateGallons(lengthFt: number, widthFt: number, avgDepthFt: number) {
  return Math.round(lengthFt * widthFt * avgDepthFt * 7.48);
}

export default function Setup({ pool, onSaved }: { pool: PoolDTO; onSaved: (p: PoolDTO) => void }) {
  const [volume, setVolume] = useState(pool.volumeGallons);
  const [surface, setSurface] = useState<Surface>(pool.surface);
  const [chem, setChem] = useState<ChemicalSet>(pool.chemicals);
  const [dims, setDims] = useState({ l: "", w: "", d: "" });
  const [saving, setSaving] = useState(false);

  const doEstimate = () => {
    const l = Number(dims.l), w = Number(dims.w), d = Number(dims.d);
    if (l > 0 && w > 0 && d > 0) setVolume(estimateGallons(l, w, d));
  };

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/pools/${pool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeGallons: volume, surface, chemicals: chem }),
      });
      const data = await res.json();
      if (res.ok) onSaved({ ...pool, ...data.pool, chemicals: chem });
    } finally {
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-semibold">Volume</h3>
        <div className="mt-2 flex items-center gap-2">
          <input type="number" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className={field} />
          <span className="text-sm opacity-70">gal</span>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer opacity-80">Estimate from dimensions</summary>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["l", "w", "d"] as const).map((k) => (
              <input
                key={k}
                type="number"
                placeholder={k === "l" ? "length ft" : k === "w" ? "width ft" : "avg depth ft"}
                value={dims[k]}
                onChange={(e) => setDims((v) => ({ ...v, [k]: e.target.value }))}
                className={field}
              />
            ))}
          </div>
          <button onClick={doEstimate} className="mt-2 rounded-lg border border-cyan-400 px-3 py-1 text-cyan-800 dark:text-cyan-200">
            Compute gallons
          </button>
        </details>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-semibold">Surface</h3>
        <select value={surface} onChange={(e) => setSurface(e.target.value as Surface)} className={`mt-2 ${field}`}>
          <option value="plaster">Plaster / gunite</option>
          <option value="vinyl">Vinyl liner</option>
          <option value="fiberglass">Fiberglass</option>
        </select>
        <p className="mt-1 text-xs opacity-60">Sets the calcium-hardness target.</p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="font-semibold">Chemicals on hand</h3>
        <div className="mt-2 space-y-3 text-sm">
          <div>
            <div className="opacity-70">Chlorine</div>
            <div className="mt-1 flex gap-2">
              <select
                value={chem.chlorine.type}
                onChange={(e) => setChem({ ...chem, chlorine: { ...chem.chlorine, type: e.target.value as ChemicalSet["chlorine"]["type"] } })}
                className={field}
              >
                <option value="liquid">Liquid chlorine</option>
                <option value="cal-hypo">Cal-hypo</option>
                <option value="dichlor">Dichlor</option>
              </select>
              <input
                type="number"
                value={chem.chlorine.percent}
                onChange={(e) => setChem({ ...chem, chlorine: { ...chem.chlorine, percent: Number(e.target.value) } })}
                className="w-24 rounded-lg border border-zinc-300 bg-white px-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
              <span className="self-center opacity-60">%</span>
            </div>
          </div>
          <div>
            <div className="opacity-70">Acid</div>
            <div className="mt-1 flex gap-2">
              <select
                value={chem.acid.type}
                onChange={(e) => setChem({ ...chem, acid: { ...chem.acid, type: e.target.value as ChemicalSet["acid"]["type"] } })}
                className={field}
              >
                <option value="muriatic">Muriatic acid</option>
                <option value="dry-acid">Dry acid</option>
              </select>
              <input
                type="number"
                value={chem.acid.percent}
                onChange={(e) => setChem({ ...chem, acid: { ...chem.acid, percent: Number(e.target.value) } })}
                className="w-24 rounded-lg border border-zinc-300 bg-white px-2 dark:border-zinc-700 dark:bg-zinc-950"
              />
              <span className="self-center opacity-60">%</span>
            </div>
          </div>
          <p className="text-xs opacity-60">Also stocked: baking soda (TA up), cyanuric acid (CYA up), calcium chloride (CH up).</p>
        </div>
      </section>

      <button onClick={save} disabled={saving} className="w-full rounded-xl bg-cyan-600 py-3 font-semibold text-white disabled:opacity-50">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
