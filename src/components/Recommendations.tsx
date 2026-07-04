"use client";

import type { Analysis, Direction, Recommendation } from "@/lib/chemistry/types";

const DIR_STYLE: Record<Direction, { label: string; cls: string }> = {
  ok: { label: "On target", cls: "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800" },
  raise: { label: "Raise", cls: "bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800" },
  lower: { label: "Lower", cls: "bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800" },
  "cannot-lower": { label: "Can't dose down", cls: "bg-violet-50 border-violet-300 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100 dark:border-violet-800" },
  info: { label: "Info", cls: "bg-zinc-50 border-zinc-300 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700" },
};

function Card({ r }: { r: Recommendation }) {
  const s = DIR_STYLE[r.direction];
  const okBand = r.stripSaysOk;
  return (
    <div className={`rounded-xl border p-4 ${s.cls}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold opacity-70">{r.label}</div>
          <div className="text-lg font-bold">{r.headline}</div>
        </div>
        <span className="shrink-0 rounded-full border border-current/30 px-2 py-0.5 text-xs font-semibold">{s.label}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>
          Measured: <strong>{r.measured ?? "—"}{r.unit ? ` ${r.unit}` : ""}</strong>
        </span>
        {r.target && (
          <span>
            Target: <strong>{r.target.low}–{r.target.high}{r.unit ? ` ${r.unit}` : ""}</strong> (aim {r.target.aim})
          </span>
        )}
        {okBand !== null && (
          <span className="opacity-80">Strip says: {okBand ? "OK" : "out of range"}</span>
        )}
        {r.lowConfidence && (
          <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">strip imprecise</span>
        )}
      </div>

      {r.dose && (
        <div className="mt-3 rounded-lg bg-white/60 p-3 text-sm dark:bg-black/30">
          <div className="font-semibold">
            Add ~{r.dose.amount} {r.dose.unit} of {r.dose.product}
            {r.dose.approximate && <span className="ml-1 font-normal opacity-70">(estimate — add ~75%, re-test)</span>}
          </div>
          {r.dose.sideEffects?.length ? (
            <ul className="mt-1 list-inside list-disc opacity-80">
              {r.dose.sideEffects.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          ) : null}
        </div>
      )}

      <p className="mt-2 text-sm leading-relaxed opacity-90">{r.explanation}</p>
    </div>
  );
}

export default function Recommendations({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-cyan-600 p-4 text-white shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Summary</div>
        <div className="text-base font-medium">{analysis.overall}</div>
      </div>

      {analysis.recommendations.map((r) => <Card key={r.key} r={r} />)}

      {analysis.notes.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-1 font-semibold">Notes</div>
          <ul className="list-inside list-disc space-y-1 opacity-90">
            {analysis.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
        <div className="mb-1 font-semibold">⚠︎ Safety</div>
        <ul className="list-inside list-disc space-y-1">
          {analysis.safety.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>
    </div>
  );
}
