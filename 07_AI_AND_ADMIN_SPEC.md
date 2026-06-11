# FodmapZen — Admin Console, AI Dietitian & AI Content Pipeline
**Date:** 2026-06-11 | **Version:** 1.0

This spec extends [05_DEVELOPMENT_PHASES.md](05_DEVELOPMENT_PHASES.md) with three new feature tracks
researched against the competitor landscape ([06_COMPETITOR_DEEP_DIVE.md](06_COMPETITOR_DEEP_DIVE.md))
and the product strategy ([02_PRODUCT_STRATEGY.md](02_PRODUCT_STRATEGY.md)).

---

## Research summary — why these features

1. **No FODMAP competitor has an AI assistant.** Fast FODMAP (21k reviews) is stagnant since 2024;
   A-to-Z is lookup-only; Cara Care is symptom-only. An AI dietitian that answers "can I eat X?",
   explains *why*, and drafts meal ideas from the user's phase + restrictions is a clear,
   defensible differentiator — and maps directly onto the existing Phase 6.4 "AI Meal Planning" item,
   pulled forward.
2. **"Dietitian-verified" positioning needs a verification workflow.** Today content lives in
   hand-written seed SQL. A dietitian cannot review or correct anything without editing TypeScript.
   A web console where a dietitian reviews, corrects, and approves entries makes the marketing claim
   real and scales content production (the $4k dietitian-contractor budget item needs a tool to work in).
3. **Content production is the bottleneck** (500 foods / 200 recipes / 15 cuisines targets).
   An AI import pipeline (paste text → structured draft → human review → approve) multiplies
   content throughput while keeping a human dietitian as the gate — which also satisfies the
   IP rule (original content only, never scraped Monash/blog data).

---

## Track A — Web Admin / Dietitian Console (`apps/web/admin`)

**Who:** `role ∈ {admin, dietitian}` (new column on `user_profiles`).
Admins manage everything; dietitians review/edit content.

**Pages:**
- `/admin` — dashboard: content counts, items pending review, recent activity.
- `/admin/foods` — searchable table of foods; inline edit of FODMAP levels, serving note,
  subgroup ratings; add new food; review status (`draft → approved`).
- `/admin/recipes` — recipe list with review queue; full editor (ingredients, steps, tags, nutrition).
- `/admin/import` — AI import: paste raw text (or upload) → AI parses to structured
  food/recipe/restaurant JSON → side-by-side review → save as `draft`.
- `/admin/login` — Supabase email auth; non-privileged users are turned away.

**Architecture:**
- Content master lives in **Supabase content tables** (new migration `002`): `content_foods`,
  `content_food_thresholds`, `content_recipes`, `content_recipe_ingredients`,
  `content_recipe_steps`, `content_recipe_tags`, `content_restaurant_cuisines`.
  Each content row has `status` (`draft | approved`), `verified_by`, `updated_at`.
- RLS: `SELECT` for any authenticated user; `INSERT/UPDATE/DELETE` only for
  `role IN ('admin','dietitian')` (checked via `public.user_role()` helper).
- The mobile app keeps shipping **bundled seeds** (offline-first is non-negotiable).
  A future export script regenerates `foodsSql.ts` / `recipesSql.ts` from approved Supabase rows
  ahead of each release (`SEED_VERSION` bump). Console = source of truth; seeds = build artifact.

## Track B — AI Dietitian (mobile, Premium-only)

- New screen `app/ai-dietitian.tsx` (chat UI). Entry: Home quick action + Tracker card.
  Free/Ad-Free users see the paywall.
- Context injected per conversation: user phase, days into elimination, dietary restrictions —
  so answers are personalized ("you're on day 12 of elimination, skip the honey…").
- Capabilities: food Q&A (FODMAP rating + why + safe swap), meal ideas/day plans from the
  bundled recipe library, restaurant ordering advice, reintroduction guidance.
- Safety: system prompt constrains to general low-FODMAP education, always recommends a
  clinician for medical questions, never diagnoses.
- **Backend:** mobile never holds the Anthropic key. It calls `POST {AI_API_URL}/api/ai/chat`
  (the Next.js app), which holds `ANTHROPIC_API_KEY` server-side. When the key is absent the
  route returns a deterministic mock so dev/preview still works.
- Model: `claude-sonnet-4-6` default (quality/cost balance for chat), low max_tokens, short history window.

## Track C — AI Content Parsing Pipeline

- `POST /api/ai/parse` with `{ kind: 'food' | 'recipe' | 'restaurant', text }`.
- Uses Claude tool-use (forced tool choice) to emit JSON conforming to `@fodmapzen/shared` types.
- Output lands in the admin Import page for human review; nothing auto-publishes — a dietitian
  must approve (status flow `draft → approved`).
- Guardrail in UI + prompt: original/general-knowledge content only; refuse verbatim copyrighted
  recipe text and Monash threshold tables.

## Tier mapping

| Feature | Free | Ad-Free | Premium |
|---|---|---|---|
| AI Dietitian chat | ✗ (paywall) | ✗ (paywall) | ✓ |
| Admin console | — staff-only (role-based, not a tier) | | |

## Env additions

- `apps/web/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
- `apps/mobile/.env`: `EXPO_PUBLIC_AI_API_URL` (dev: `http://localhost:3000`)

## Rollout / done criteria

1. Migration 002 applied (`supabase db push`); at least one user promoted to `admin` manually.
2. Admin console: dietitian can log in, search foods, correct a FODMAP level, approve a draft.
3. Import page: paste recipe text → structured draft appears → saved to Supabase as draft.
4. Mobile: Premium user chats with AI dietitian; Free user hits paywall; offline app unaffected.
5. Mock mode works with no Anthropic key (testable in CI/dev).
