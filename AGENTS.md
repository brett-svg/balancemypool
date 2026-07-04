<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BalanceMyPool

Personal, mobile-first web app: read a pool test strip photo → expert balancing advice + a context-aware chat. Two chlorine pools (Lynn's, Madeline's), no auth. Deploys as one Railway service + Railway Postgres. See README.md.

## Architecture rules (don't break these)

- **The chemistry engine owns every dose NUMBER; the LLM never computes doses.** OpenAI reads the strip photo and powers the chat's prose, but all quantities come from `src/lib/chemistry/`. The chat is told to cite the engine's figures, not invent math. Keep this split.
- **Strips are data, not code.** `src/lib/strips/` — each strip is a `StripDefinition` (pads, breakpoints, reference swatch hexes, printed "OK" bands). Add a new brand as a new object in the registry; never branch reading/chemistry logic on brand. Both pools use `easytest-7in1` today.
- **CYA-adjusted (Trouble Free Pool) methodology.** The Free Chlorine target scales with CYA (`targets.ts#fcTarget`). This is why the app deliberately disagrees with the strip's printed FC "OK" band — surfaced honestly in "transparent expert mode" (`analyze.ts`).
- **Dose factors** (`chemicals.ts`) are the published per-10,000-gallon constants, scaled by pool volume in `dosing.ts`. pH-down is inherently approximate — it's flagged, not hidden.

## Layout

- `src/lib/strips/` — strip definitions (client-safe; no server deps)
- `src/lib/chemistry/` — targets, chemicals, dosing, analyze (pure, deterministic)
- `src/lib/vision.ts` / `src/lib/openai.ts` — OpenAI strip reading
- `src/lib/chat.ts` — grounded chat system prompt
- `src/app/api/` — route handlers (read-strip, chat, pools, readings)
- `src/components/` — client UI (PoolApp orchestrator + Recommendations/ReviewForm/Chat/Setup)
- `prisma/` — schema + seed (Lynn 3700 gal; Madeline via estimator)

## Gotchas

- Prisma is pinned to **v6** (v7 dropped the classic `url = env(...)` datasource model). Client generates to `src/generated/prisma` (gitignored).
- OpenAI models are env-configurable (`OPENAI_VISION_MODEL` / `OPENAI_CHAT_MODEL`, default `gpt-5.2`).
- Local dev Postgres runs on port **5433** in these docs to avoid clashing with anything on 5432.
