"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why raise chlorine if the strip says OK?",
  "How much acid do I add?",
  "Is it safe to swim right now?",
  "Why is my water cloudy?",
];

export default function Chat({ poolId, poolName }: { poolId: string; poolName: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId, messages: next }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        setMessages([...next, { role: "assistant", content: `⚠︎ ${err.error ?? "Chat failed."}` }]);
        return;
      }
      setMessages([...next, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="space-y-3 pt-4 text-center">
            <p className="text-sm opacity-70">Ask the pool expert about {poolName}. It knows this pool&apos;s latest test and recommendations.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-cyan-300 px-3 py-1 text-sm text-cyan-800 dark:border-cyan-800 dark:text-cyan-200">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="text-right">
              <div className="inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-cyan-600 px-3 py-2 text-sm text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="text-left">
              <div className="inline-block max-w-[85%] rounded-2xl bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
                {m.content ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:my-1.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span>{busy ? "…" : ""}</span>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-zinc-200 p-2 dark:border-zinc-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this pool…"
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button disabled={busy || !input.trim()} className="rounded-xl bg-cyan-600 px-4 font-semibold text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
