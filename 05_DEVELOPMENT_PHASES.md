# FodMap Feast — Development Phases
**Date:** 2026-06-10 | **Version:** 1.0

---

## Overview

| Phase | Name | Duration | Deliverable |
|---|---|---|---|
| 0 | Setup & Content | 2 weeks | Dev environment, DB schema, 30 starter recipes |
| 1 | MVP Mobile App | 5 weeks | Working iOS + Android app (Free + Premium tiers) |
| 2 | Meal Planner + Shopping List | 3 weeks | Core premium features |
| 3 | Reintroduction + Restaurant Guide | 2 weeks | Full Phase 2/3 FODMAP support |
| 4 | Marketing Website + Web Dashboard | 3 weeks | Web presence + basic web app |
| 5 | Polish + Beta + Launch | 2 weeks | App Store + Play Store live |
| 6 | Post-Launch Growth | Ongoing | Barcode scanner, AI features, dietitian Q&A |

**Total to launch: ~17 weeks (~4 months)**

---

## Phase 0 — Setup & Content Foundation
**Duration:** 2 weeks
**Goal:** Everything needed before a single line of UI code is written

### 0.1 Development Environment Setup
- [ ] Create GitHub repository (monorepo: `apps/mobile`, `apps/web`, `packages/shared`)
- [ ] Initialize React Native app with Expo (Expo SDK 52+)
- [ ] Initialize Next.js 15 app (app router)
- [ ] Set up Supabase project (database + auth + storage)
- [ ] Configure RevenueCat (subscription management)
- [ ] Set up EAS (Expo Application Services) for builds
- [ ] Configure ESLint, Prettier, TypeScript strict mode
- [ ] Set up GitHub Actions CI (lint + type-check on every PR)

### 0.2 Database Schema Design
**SQLite (local, on-device):**
```sql
foods (id, name, category, serving_size_g, fodmap_level, fructans, gos,
       lactose, fructose, polyols, notes, source, updated_at)

food_serving_thresholds (food_id, serving_size_g, fodmap_level)
  -- Multiple rows per food (different levels at different servings)

recipes (id, title, category, prep_mins, cook_mins, servings_default,
         difficulty, calories, protein, carbs, fat, image_url, is_premium,
         phase_compatible, created_at)

recipe_ingredients (recipe_id, food_id, amount, unit, notes, is_optional)

recipe_steps (recipe_id, step_number, instruction, image_url)

recipe_tags (recipe_id, tag)
  -- tags: breakfast, lunch, dinner, snack, dessert, vegan, vegetarian,
  --       gluten-free, dairy-free, quick (<15min), batch-cook, etc.
```

**Supabase (remote, synced):**
```sql
users (id, email, created_at, phase, phase_start_date, preferences)

user_meal_plans (id, user_id, week_start, created_at, updated_at)

meal_plan_slots (id, meal_plan_id, day_of_week, meal_type, recipe_id)

food_logs (id, user_id, date, recipe_id, food_id, amount, notes, logged_at)

symptom_logs (id, user_id, date, bloating, gas, pain, stool_type,
              stress_level, notes, logged_at)

reintroduction_tests (id, user_id, fodmap_group, food_tested,
                      start_date, day1_reaction, day2_reaction, day3_reaction,
                      final_verdict, notes)

user_favorites (user_id, recipe_id, saved_at)
```

### 0.3 Content Pipeline
- [ ] Source 30 starter recipes (Free tier) — can be created in-house
- [ ] Build FODMAP food database CSV (500 foods) from Monash published data
- [ ] Write seed SQL for food database + starter recipes
- [ ] Define recipe JSON schema for content pipeline
- [ ] Begin outreach to dietitian contractor for Phase 1 verification

### 0.4 Design Handoff
- [ ] Figma component library completed
- [ ] All Phase 1 screens annotated in Figma
- [ ] App icon finalized
- [ ] App Store screenshots template prepared

**Phase 0 Exit Criteria:**
- Repo initialized, CI passing
- Supabase project live with schema applied
- 30 recipes in database, seed SQL ready
- Food database (500 foods) seeded
- All Phase 1 screens designed in Figma

---

## Phase 1 — MVP Mobile App
**Duration:** 5 weeks
**Goal:** Functional iOS + Android app with Free and Ad-Free tiers, ready for TestFlight beta

### Week 1: Foundation + Navigation
- [ ] Bottom tab navigator setup (Home / Recipes / Meal Plan / Tracker / Profile)
- [ ] Onboarding flow (5 screens) with phase selection + dietary preferences
- [ ] Supabase Auth integration (email + Apple + Google sign-in)
- [ ] SQLite initialization with bundled food + recipe database
- [ ] Global state setup (Zustand: user, phase, preferences, sync queue)
- [ ] Design system components: colors, typography, Button, Card, Tag, Header

### Week 2: Food Database + Recipes
- [ ] Food database screen: search, filter by FODMAP level, autocomplete
- [ ] Food detail screen: serving size slider → dynamic FODMAP status update
- [ ] Recipe list screen: filter by meal type, dietary tags, cook time
- [ ] Recipe detail screen: ingredients with FODMAP badges, step-by-step, serving adjuster
- [ ] Favorites (save/unsave recipes locally)
- [ ] Offline content verification (all content works with airplane mode)

### Week 3: Home Tab + Phase Tracker
- [ ] Home tab: today's meals, phase indicator, quick actions, week-at-a-glance
- [ ] Phase tracker: Elimination / Reintroduction / Maintenance selection
- [ ] Phase timer (days remaining in elimination, progress bar)
- [ ] Basic food log (log a meal by recipe or free text)
- [ ] Push notification setup (Expo Notifications): daily meal reminder

### Week 4: Subscription + Premium Gate
- [ ] RevenueCat integration (iOS + Android)
- [ ] Free / Ad-Free ($2.99) / Premium ($7.99/month, $59.99/year) products configured
- [ ] 14-day free trial for Premium (no credit card)
- [ ] Premium gate: contextual half-sheet upgrade prompts on locked features
- [ ] Ad integration (Google AdMob) for Free tier — bottom banner only
- [ ] Restore purchases flow
- [ ] Profile tab: subscription status, manage subscription

### Week 5: Polish + Edge Cases
- [ ] Empty states for all screens (new user, no meal plan, no logs)
- [ ] Error states (offline with no cached data, sync failure)
- [ ] Loading skeletons for async data
- [ ] Haptic feedback on key interactions (iOS)
- [ ] Accessibility pass (VoiceOver labels, contrast check, tap targets)
- [ ] App icon, splash screen, bundle ID configuration
- [ ] EAS Build setup for TestFlight + Play Store Internal Testing

**Phase 1 Exit Criteria:**
- App installable on iOS + Android from TestFlight/Play Internal
- All Free tier features functional offline
- Subscription purchase flow complete (sandbox tested)
- 0 crash-on-launch on iPhone 14+, Pixel 7+
- 20 beta testers using the app for 1 week with feedback collected

---

## Phase 2 — Meal Planner + Shopping List
**Duration:** 3 weeks
**Goal:** The flagship Premium feature — weekly planning and shopping

### Week 6: Meal Planner Core
- [ ] Weekly calendar view (horizontal tabs Mon–Sun)
- [ ] Meal slots per day: Breakfast / Lunch / Dinner / Snack
- [ ] Add recipe to slot (search + browse)
- [ ] Remove recipe from slot
- [ ] Auto-generate week: algorithm that fills slots with preference-matched recipes
  - Respects dietary restrictions from preferences
  - No recipe repeated within 3 days
  - Balances meal types and cook times
  - Only low-FODMAP recipes for elimination phase
- [ ] Save meal plan to Supabase (cloud sync)
- [ ] Load meal plan from Supabase (cross-device)

### Week 7: Shopping List Generator
- [ ] Aggregate ingredients from all planned recipes
- [ ] Deduplicate + sum quantities (e.g., 3 recipes using olive oil → total amount)
- [ ] Group by supermarket section (Produce / Meat & Fish / Dairy / Pantry / Frozen)
- [ ] Check-off items as you shop (local state, persists between sessions)
- [ ] "Add custom item" (freetext)
- [ ] Share list via Share API (text format for WhatsApp, Notes, etc.)
- [ ] Clear completed items

### Week 8: Meal Plan Templates + History
- [ ] Save current week as a named template ("Week 1 Elimination Plan")
- [ ] Load saved templates
- [ ] Meal plan history (last 4 weeks accessible)
- [ ] Copy last week's plan to this week
- [ ] Nutritional summary for the week (total calories, protein, carbs, fat)

**Phase 2 Exit Criteria:**
- Weekly meal planner functional for Premium users
- Auto-generate produces a valid 7-day plan in < 2 seconds
- Shopping list generates correctly from a 21-meal week
- Cloud sync working (plan created on iPhone, visible in web account)
- 50 beta testers using meal planner, ≥ 80% complete a full week plan

---

## Phase 3 — Reintroduction Tracker + Restaurant Guide
**Duration:** 2 weeks
**Goal:** Complete the FODMAP journey support; no competitor has this

### Week 9: Reintroduction Tracker
- [ ] Guided reintroduction protocol (Monash-aligned)
  - 6 FODMAP subgroups: Fructans / GOS / Lactose / Fructose / Sorbitol / Mannitol
  - Each tested over 3 days at low → medium → high dose
  - Rest days between tests (3 days minimum)
- [ ] Current test screen: food name, day counter, reaction log (0–4 severity)
- [ ] Reaction notes (freetext)
- [ ] Test history: timeline view of all tested foods + results
- [ ] Verdict system: Tolerated / Sensitive / Avoid
- [ ] "Safe list": foods/groups that passed → automatically unlocks in recipe filters
- [ ] PDF export: full reintroduction report (name, date, food tested, reactions, verdict)
- [ ] Push notification: "Day 2 of lactose testing — log your reaction"

### Week 10: Restaurant Guide
- [ ] 15 cuisine types: Italian, Thai, Mexican, Indian, Chinese, Japanese, French,
       Mediterranean, American, Middle Eastern, Greek, Vietnamese, Korean, Burgers, Pizza
- [ ] Each cuisine: 5–8 safe dishes, 5–8 risky dishes, 3–5 ordering tips
- [ ] "Swap" tips: "Ask for no onion/garlic" (since these are common FODMAP offenders)
- [ ] Search by cuisine type or dish name
- [ ] Save favorites (cuisines you eat most often)
- [ ] Shareable "safe choices" card (image export for WhatsApp to send to friends)
- [ ] Full symptom diary: gas, bloating, pain (1–5 scale), stool type (Bristol 1–7),
       stress level, sleep quality, medications

**Phase 3 Exit Criteria:**
- Reintroduction tracker guides user through a complete 3-day food test
- PDF export generates successfully on both platforms
- Restaurant guide covers all 15 cuisines with verified content
- Symptom diary functional with 30-day history

---

## Phase 4 — Marketing Website + Web Dashboard
**Duration:** 3 weeks
**Goal:** Web presence for marketing + basic web access for Premium users

### Week 11: Marketing Website (Next.js)
- [ ] Home page: hero, features, social proof, pricing, download CTAs
- [ ] Features page: detailed feature breakdown with screenshots
- [ ] Pricing page: Free / Ad-Free / Premium comparison table
- [ ] Blog (MDX): first 3 SEO articles published
  - "Low FODMAP Meal Plan Week 1 (Free Download)"
  - "FODMAP Reintroduction: Step-by-Step Guide"
  - "Low FODMAP Restaurant Guide"
- [ ] For Dietitians landing page
- [ ] App download page with QR codes
- [ ] Email waitlist / notification signup (convert to download)
- [ ] Deploy to Vercel, custom domain

### Week 12: Web App — Foundation
- [ ] Supabase Auth on web (sign in with same account as mobile)
- [ ] Shared component library (`packages/shared`) used by both mobile + web
- [ ] Web app layout: sidebar nav (Meal Plan / Recipes / Tracker / Account)
- [ ] Recipe browser (same 200+ recipes, web-formatted)
- [ ] Food database search (web)

### Week 13: Web App — Key Features
- [ ] Meal planner (web view of same plan synced from mobile)
- [ ] Shopping list (printable, web)
- [ ] Reintroduction tracker (web view)
- [ ] Symptom diary (log from desktop)
- [ ] Account / subscription management
- [ ] Premium gate (redirect to pricing if not Premium)

**Phase 4 Exit Criteria:**
- Marketing website live at custom domain, Google indexed
- Web app functional for Premium users (meal plan viewable + editable)
- 3 SEO articles published and submitted to Google Search Console
- Email waitlist capturing leads

---

## Phase 5 — Polish, Beta, Launch
**Duration:** 2 weeks
**Goal:** Public launch on App Store + Google Play

### Week 14: Pre-Launch Polish
- [ ] Full regression test on all features (iOS + Android)
- [ ] Performance audit: app launch < 2s cold start, food search < 0.5s
- [ ] Memory profiling (SQLite should not exceed 50MB RAM)
- [ ] App Store listing: screenshots (6 × iPhone 15 Pro), preview video, description
- [ ] Google Play listing: same assets + feature graphic
- [ ] App Store review compliance audit (health app guidelines)
- [ ] Privacy policy + Terms of Service pages live on website
- [ ] Crashlytics / Sentry error monitoring setup
- [ ] Analytics (Mixpanel or PostHog): key events tracked
  - onboarding_complete, recipe_view, meal_plan_created, upgrade_tapped,
    subscription_purchased, shopping_list_generated, reintroduction_started

### Week 15: Launch
- [ ] Submit to App Store (allow 3–5 day review)
- [ ] Submit to Google Play (allow 1–3 day review)
- [ ] Product Hunt submission (Tuesday launch)
- [ ] Reddit announcement posts (r/FODMAP, r/ibs)
- [ ] RD email campaign: "It's live"
- [ ] Social media launch posts
- [ ] Monitor crash reports + support inbox

**Phase 5 Exit Criteria:**
- App live on both stores
- No P0/P1 bugs in first 48 hours
- First 100 organic downloads
- App Store rating ≥ 4.0 from beta reviews

---

## Phase 6 — Post-Launch Growth Features
**Duration:** Ongoing (monthly releases)

### 6.1 Barcode Scanner (Month 2)
- [ ] Camera permission + barcode scan (Expo Camera)
- [ ] Product lookup via Open Food Facts API + Monash-verified products
- [ ] Display FODMAP status of scanned product
- [ ] Add to food log directly from scan

### 6.2 Enhanced Personalization (Month 3)
- [ ] Recipe filter by verified-safe foods (from reintroduction results)
- [ ] "Safe for you" recipe badge (based on passed reintroduction tests)
- [ ] Meal plan skips ingredients from failed reintroduction tests
- [ ] Smart shopping list (marks items you already have)

### 6.3 Dietitian Q&A Integration (Month 4–6)
- [ ] Async messaging with contracted RD partners
- [ ] Group Q&A session scheduling (Zoom-integrated or in-app video)
- [ ] Dietitian dashboard (separate web tool for RDs to see patient logs)

### 6.4 AI Meal Planning (Month 6+)
- [ ] Claude API integration for personalized meal suggestions
- [ ] Natural language: "I want something quick for tomorrow that uses zucchini"
- [ ] Adaptive plan (learns from logged meals and reactions over time)

---

## Tech Stack Summary

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Mobile | React Native + Expo | SDK 52 | Cross-platform, strong community |
| Web | Next.js | 15 (App Router) | SSR for SEO, same team knows React |
| Shared logic | TypeScript packages | — | Reuse types, DB utils, validation |
| Local DB | expo-sqlite | Latest | Offline-first, FTS5 search, WAL mode |
| Remote DB | Supabase (PostgreSQL) | — | Auth + sync + Row-Level Security |
| Auth | Supabase Auth | — | Email + Apple + Google sign-in |
| Subscriptions | RevenueCat | — | Best-in-class for iOS+Android subscriptions |
| Ads | Google AdMob | — | Free tier banner ads |
| State | Zustand | — | Lightweight, DevTools support |
| Sync | Custom outbox pattern | — | Conflict-safe offline→online sync |
| Styling | NativeWind (Tailwind for RN) | 4.x | Shared utility classes |
| Navigation | Expo Router | 3.x | File-based routing, works for both |
| Hosting | Vercel | — | Next.js-native, great DX |
| CI/CD | GitHub Actions + EAS | — | Automated builds + OTA updates |
| Monitoring | Sentry | — | Crash reporting mobile + web |
| Analytics | PostHog | — | Open-source, self-hostable, good for privacy |
| Content | MDX | — | Blog posts with React components |

---

## Repository Structure

```
fodmap-feast/
├── apps/
│   ├── mobile/              # React Native Expo app
│   │   ├── app/             # Expo Router screens
│   │   │   ├── (tabs)/      # Bottom tab screens
│   │   │   ├── onboarding/  # Onboarding flow
│   │   │   └── modals/      # Modal screens
│   │   ├── components/      # Mobile-only components
│   │   ├── db/              # SQLite schema + seed data
│   │   └── assets/          # Images, fonts, icons
│   │
│   └── web/                 # Next.js app
│       ├── app/             # App Router pages
│       │   ├── (marketing)/ # Public marketing pages
│       │   └── (dashboard)/ # Auth-protected web app
│       ├── components/      # Web-only components
│       └── content/         # MDX blog posts
│
├── packages/
│   ├── shared/              # Shared types, utils, constants
│   │   ├── types/           # TypeScript interfaces
│   │   ├── constants/       # FODMAP data, phase configs
│   │   └── utils/           # Shared calculation logic
│   └── ui/                  # Shared component primitives (future)
│
├── supabase/
│   ├── migrations/          # Database schema migrations
│   └── seed/                # Initial data seeds
│
└── content/
    ├── recipes/             # Recipe JSON files
    ├── foods/               # Food database CSV
    └── restaurant-guide/    # Restaurant guide content
```

---

## Budget Estimate

| Item | Cost | When |
|---|---|---|
| Dietitian contractor (150 recipes + verification) | $4,000 | Phase 0–1 |
| Food photography (30 hero photos) | $1,500 | Phase 1 |
| Figma design (if outsourced) | $2,000–3,000 | Phase 0 |
| Supabase Pro plan | $25/month | Phase 1+ |
| RevenueCat (free < $2.5K MRR) | $0 until profitable | Phase 1+ |
| Apple Developer Program | $99/year | Phase 0 |
| Google Play Developer | $25 one-time | Phase 0 |
| Sentry (free tier) | $0 | Phase 5 |
| PostHog (free tier) | $0 | Phase 5 |
| Vercel (hobby) | $0 | Phase 4 |
| AdMob (revenue share) | Revenue share | Phase 1+ |
| **Total out-of-pocket to launch** | **~$8,000–10,000** | |

---

## Phase Review Checkpoints

After each phase is complete, a summary will be shared for review before the next phase begins:

- **Phase 0 Review:** Schema, seed data, dev env, Figma designs → approve before coding starts
- **Phase 1 Review:** Working beta on TestFlight/Play → test on device before Phase 2
- **Phase 2 Review:** Meal planner + shopping list on beta → validate core premium feature
- **Phase 3 Review:** Reintroduction + restaurant guide → content accuracy review
- **Phase 4 Review:** Website live, web dashboard functional → SEO + marketing check
- **Phase 5 Review:** App Store + Play Store submissions → final pre-launch sign-off
- **Phase 6 Reviews:** Monthly feature release reviews (ongoing)
