# BalanceMyPool

A personal, mobile-first web app that reads a pool test strip from a photo and gives **expert, quantitative balancing advice** — plus a context-aware pool-chemistry chat. Built for two chlorine pools (Lynn's and Madeline's); no auth.

## What it does

1. **Snap a strip** → OpenAI vision reads each pad against the strip's known color chart.
2. **Review & confirm** the values (catch any misread pad before dosing).
3. A **deterministic chemistry engine** computes exact doses for your pool's volume and chemicals, using the **CYA-adjusted (Trouble Free Pool) methodology** — the correct chlorine level depends on your stabilizer, so the engine is often *more correct than the strip's printed "OK" bands*, and it says so ("transparent expert mode").
4. **Ask the expert** — a chat grounded in the active pool's profile, latest reading, and the engine's computed doses. It explains and advises but never invents dose numbers.
5. Every reading + recommendation is **saved to Postgres**.

The AI reads and explains; the **engine owns every number**. That split is deliberate — real chemistry goes into real water, so doses come from documented formulas, not a language model.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Prisma 6 + PostgreSQL
- OpenAI (vision + chat), server-side only
- Deploys as a single Railway service + Railway Postgres

## Local development

```bash
npm install

# 1. A local Postgres (any will do). Example with Docker on port 5433:
docker run -d --name bmp-postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=balancemypool \
  -p 5433:5432 postgres:16

# 2. Configure env
cp .env.example .env      # then paste your OPENAI_API_KEY

# 3. Schema + seed the two pools
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open the printed `localhost` URL on your phone (same network) to use the camera.

## Deploying to Railway

1. Push this repo to GitHub (`origin` is already `brett-svg/balancemypool`).
2. New Railway project → deploy from the repo. Add the **Postgres** plugin — it provides `DATABASE_URL`.
3. Set service variables: `OPENAI_API_KEY` (and optionally `OPENAI_VISION_MODEL` / `OPENAI_CHAT_MODEL`).
4. `npm run build` / `npm run start` are the build/start commands. `postinstall` runs `prisma generate`. After the first deploy, run `npm run db:push` (and `npm run db:seed` once) against the Railway database.

## Key design notes

- **Strips are data, not code.** `src/lib/strips/` holds each strip definition (pads, breakpoints, reference swatch colors, the printed "OK" bands). Adding Lynn's strip later — once you know what it is — is a new object in the registry, nothing else. Both pools currently use the **EASYTEST 7-in-1**.
- **Chemistry engine** lives in `src/lib/chemistry/`: `targets.ts` (CYA-adjusted target model), `chemicals.ts` (documented per-10k-gallon dose factors), `dosing.ts` (volume-scaled doses), `analyze.ts` (the transparent-mode recommendations).
- **Strip limits are surfaced honestly.** Strips read CYA in wide buckets and are coarse on chlorine; the app shows ranges (not false precision) and recommends a drop-based test when CYA is the deciding factor.

## Not yet built (v2)

Trend analytics (CYA creep, chlorine demand), Lynn's real strip definition, per-pad confidence heatmaps, product side-effect chains, estimator polish, PWA/offline.
