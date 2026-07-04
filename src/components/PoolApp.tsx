"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Analysis } from "@/lib/chemistry/types";
import type { PoolDTO, ReadConfidence, ReadValues } from "@/lib/dto";
import { fileToDownscaledDataUrl } from "@/lib/image";
import Recommendations from "@/components/Recommendations";
import ReviewForm from "@/components/ReviewForm";
import Chat from "@/components/Chat";
import Setup from "@/components/Setup";

type Tab = "test" | "chat" | "setup";
type TestStage = "capture" | "review" | "results";

export default function PoolApp() {
  const [pools, setPools] = useState<PoolDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("test");
  const [error, setError] = useState<string | null>(null);

  // Test-flow state
  const [stage, setStage] = useState<TestStage>("capture");
  const [reading, setReading] = useState<ReadValues>({});
  const [confidence, setConfidence] = useState<ReadConfidence>({});
  const [modelNotes, setModelNotes] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = pools.find((p) => p.id === activeId) ?? null;

  // Switch the active pool: reset the test flow and load that pool's latest
  // analysis. Called from the switcher and from the initial load — never as a
  // synchronous state-reset inside an effect body.
  const selectPool = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem("activePoolId", id);
    setStage("capture");
    setAnalysis(null);
    setError(null);
    fetch(`/api/pools/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.analysis) {
          setAnalysis(d.analysis);
          setStage("results");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/pools")
      .then((r) => r.json())
      .then((d) => {
        const list: PoolDTO[] = d.pools ?? [];
        setPools(list);
        const saved = typeof window !== "undefined" ? localStorage.getItem("activePoolId") : null;
        const initial = saved && list.some((p) => p.id === saved) ? saved : list[0]?.id ?? null;
        if (initial) selectPool(initial);
      })
      .catch(() => setError("Couldn't load pools. Is the database set up?"));
  }, [selectPool]);

  async function onPhoto(file: File) {
    if (!active) return;
    setError(null);
    setBusy(true);
    try {
      const imageDataUrl = await fileToDownscaledDataUrl(file);
      const res = await fetch("/api/read-strip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId: active.id, imageDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Read failed");
      setReading(data.values);
      setConfidence(data.confidence);
      setModelNotes(data.modelNotes ?? "");
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read the strip.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveReading(values: ReadValues) {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pools/${active.id}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setAnalysis(data.analysis);
      setStage("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-24 pt-4">
      <header className="mb-3">
        <h1 className="text-2xl font-black tracking-tight text-cyan-700 dark:text-cyan-400">BalanceMyPool</h1>
        <p className="text-sm opacity-60">Snap a test strip. Get expert advice.</p>
      </header>

      {/* Pool switcher */}
      <div className="mb-4 flex gap-2">
        {pools.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPool(p.id)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${
              p.id === activeId
                ? "border-cyan-600 bg-cyan-600 text-white"
                : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            {p.name}
            <span className="block text-xs font-normal opacity-70">{p.volumeGallons.toLocaleString()} gal</span>
          </button>
        ))}
      </div>

      {error && <div className="mb-3 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">{error}</div>}

      {/* Tabs */}
      <div className="mb-4 flex rounded-xl bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
        {(["test", "chat", "setup"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 font-semibold capitalize ${tab === t ? "bg-white shadow dark:bg-zinc-950" : "opacity-60"}`}
          >
            {t === "test" ? "Test" : t === "chat" ? "Ask expert" : "Setup"}
          </button>
        ))}
      </div>

      {!active ? (
        <div className="opacity-60">Loading…</div>
      ) : tab === "test" ? (
        <div>
          {stage === "capture" && (
            <div className="space-y-4 text-center">
              <div className="rounded-2xl border-2 border-dashed border-cyan-300 p-8 dark:border-cyan-800">
                <p className="mb-4 text-sm opacity-70">Dip your EASYTEST strip, wait ~15s, then photograph it in good light.</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                  className="rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Reading…" : "📷 Photograph strip"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])}
                />
              </div>
              {analysis && (
                <button onClick={() => setStage("results")} className="text-sm text-cyan-700 underline dark:text-cyan-300">
                  View last results
                </button>
              )}
            </div>
          )}

          {stage === "review" && (
            <ReviewForm
              stripId={active.stripId}
              initial={reading}
              confidence={confidence}
              modelNotes={modelNotes}
              onSave={saveReading}
              onCancel={() => setStage("capture")}
              saving={busy}
            />
          )}

          {stage === "results" && analysis && (
            <div className="space-y-4">
              <Recommendations analysis={analysis} />
              <button onClick={() => setStage("capture")} className="w-full rounded-xl border border-cyan-500 py-3 font-semibold text-cyan-700 dark:text-cyan-300">
                New test
              </button>
            </div>
          )}
        </div>
      ) : tab === "chat" ? (
        <Chat poolId={active.id} poolName={active.name} />
      ) : (
        <Setup pool={active} onSaved={(p) => setPools((list) => list.map((x) => (x.id === p.id ? p : x)))} />
      )}
    </div>
  );
}
