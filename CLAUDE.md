# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FodmapZen — an offline-first, low-FODMAP meal-planning / IBS food app for people on the elimination → reintroduction → maintenance journey. Mobile app is the product; the web app is marketing + a future Premium dashboard. The roadmap and phase exit-criteria live in [05_DEVELOPMENT_PHASES.md](05_DEVELOPMENT_PHASES.md) — treat it as the source of truth for what's in/out of scope for the current phase.

## Monorepo layout

pnpm workspace (`apps/*`, `packages/*`):

- `apps/mobile` — Expo SDK 56 + expo-router app. **This is the main app.**
- `apps/web` — Next.js 16 (marketing site + admin/dietitian console at `/admin` + the AI API routes `/api/ai/chat` and `/api/ai/parse`, which hold the server-side `ANTHROPIC_API_KEY` and fall back to a deterministic mock when it's absent). Spec: [07_AI_AND_ADMIN_SPEC.md](07_AI_AND_ADMIN_SPEC.md). The mobile AI Dietitian screen (`app/ai-dietitian.tsx`, Premium-gated) calls this app via `EXPO_PUBLIC_AI_API_URL`.
- `packages/shared` — `@fodmapzen/shared`: TypeScript types, FODMAP constants (`PHASE_LABELS`, `ELIMINATION_PHASE_DAYS`, `FODMAP_GROUPS`, `RESTAURANT_GUIDE`), and pure utils (`phaseDaysRemaining`, `deriveReintroVerdict`, etc.). Consumed via `main`/`types` pointing straight at `src/index.ts` (no build step).
- `supabase/migrations` — remote Postgres schema (RLS + triggers).

## Commands

**Always use pnpm, never npm or `expo install`.** `expo install` shells out to `npm install`, which chokes on the `workspace:*` protocol. To add a mobile dep: `pnpm --filter mobile add <pkg>` (and `-D` for dev deps).

```bash
pnpm install                              # bootstrap workspace
pnpm mobile                               # expo start (mobile)
pnpm --filter mobile exec expo start --web --port 8090   # run in a browser
pnpm web                                  # next dev (web)
pnpm build:web                            # next build
```

**Typechecking is the de-facto test gate** (there are no unit tests yet).
- Root `pnpm -r typecheck` / `pnpm -r lint` only hit packages that define those scripts — **`apps/mobile` defines neither**, so those commands silently skip the main app.
- To typecheck mobile, run its local compiler directly:
  `apps/mobile/node_modules/.bin/tsc --noEmit -p apps/mobile/tsconfig.json`
- Note `@fodmapzen/shared` only resolves under tsc once pnpm has created the workspace symlinks; if you see TS2307 for it, run `pnpm install` first.

## Mobile build config — the non-obvious wiring

These are easy to break and the app won't render (or won't bundle) without them:

- **Entry point** is `expo-router/entry` (set in `apps/mobile/package.json` `main`). There is no `App.tsx`.
- **`babel.config.js`** must use `["babel-preset-expo", { jsxImportSource: "nativewind" }]` + `"nativewind/babel"`, and `babel-preset-expo` must be an explicit devDep (pnpm hides transitive deps, so a bare `require` of it fails).
- **`metro.config.js`** does three things that are all required: (1) wraps config in `withNativeWind(..., { input: './global.css' })`; (2) adds the workspace root to `watchFolders` + `nodeModulesPaths` so `@fodmapzen/shared` resolves; (3) pushes `wasm` onto `assetExts` and sets `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` headers — both needed for `expo-sqlite`'s web (wa-sqlite) worker.
- **`tailwind.config.js`** sets `darkMode: 'class'`. Without it NativeWind throws `"Cannot manually set color scheme, as dark mode is type 'media'"` at runtime on web.
- The design system lives in `tailwind.config.js` `theme.extend` (colors like `primary`, `fodmap.*`, `text.*`; `font-sans`/`font-sans-bold` map to DM Sans). Style with `className`; reach for inline `style` only for dynamic FODMAP colors.
- **Web layout** is intentionally constrained to a centered ~448px column in `app/_layout.tsx` (`Platform.OS === 'web'`) so the mobile-first UI doesn't stretch.

## Data architecture

Two databases, deliberately split:

- **On-device SQLite** (`expo-sqlite`, db file `fodmapzen.db`) holds all *reference content* (foods, recipes, ingredients, steps, tags, serving thresholds) plus *local user data* (profile, food/symptom logs, favorites, meal plans). The app is fully usable offline; everything in `apps/mobile/lib/db/database.ts` goes through this.
- **Supabase Postgres** (`apps/mobile/lib/supabase/client.ts`) is for auth + cloud sync only. Its storage adapter falls back to `localStorage` on web because `expo-secure-store` is native-only — keep that fallback when touching the client.

### Seeding (read before editing `lib/db/seeds/*`)

- Schema is inlined as `SCHEMA_SQL` (`schema.ts`); seed data is inlined SQL strings (`seeds/foodsSql.ts`, `seeds/recipesSql.ts`) — **not** loaded as assets.
- `initializeDatabase()` is a **singleton guarded by a module-level promise** (React fires effects twice in dev; without the guard the seed runs concurrently and duplicates rows). Keep that guard.
- Re-seeding is **version-gated**: bump `SEED_VERSION` in `database.ts` whenever you change seed content. On a version bump it wipes only the reference tables and re-inserts, backing up & restoring `recipe_favorites` first (recipes cascade-delete favorites). User logs/profile are never touched.
- Food IDs are category-prefixed (`f`=fruit, `v`=vegetable, `g`=grain, `p`=protein, `d`=dairy, `da`=dairy-alt, `ns`=nut-seed, `c`=condiment, `hs`=herb-spice, `sw`=sweetener, `bv`=beverage, `sn`=snack). **The food list is large and already covers common items — grep `foodsSql.ts` for a name before adding it**, or you'll create duplicate-name rows (there is no UNIQUE on `name`).

## Content & IP rule

Food FODMAP classifications and recipes here are **original / general-knowledge** content. Do **not** scrape or copy Monash University FODMAP data (their tested gram thresholds are licensed IP) or recipe-blog content — the product's "dietitian-verified" positioning and its commercial viability depend on the content being original. Expand the database by writing new entries, not by importing third-party datasets.

## Environment

`apps/mobile/.env` holds `EXPO_PUBLIC_*` keys (Supabase URL/anon key, RevenueCat iOS/Android keys). Anything the client reads must be `EXPO_PUBLIC_`-prefixed. RevenueCat is native-only; on web/Expo Go the paywall simulates Premium by flipping the Zustand tier (`store/userStore.ts`), which is in-memory and resets on reload.
