# Research Report: FodMap Feast
**ID:** 2 | **Category:** Health / Diet | **Date Researched:** 2026-06-07

---

## App Concept

A fully offline, ad-free low-FODMAP meal planning app built for IBS sufferers. Key differentiator: real recipes stored on-device (no link-outs), full weekly meal plans with auto-generated shopping lists, phase tracking for the elimination and reintroduction stages, and a restaurant guide. Designed to be the Monash FODMAP app's friendly, meal-planning-focused companion.

---

## A. Market Viability

### Demand Signals
- IBS (Irritable Bowel Syndrome) affects **~11% of the global population** — roughly 600M+ people
- Low-FODMAP diet is the clinically recommended first-line dietary treatment for IBS, prescribed by gastroenterologists worldwide
- **"low FODMAP recipes"** keyword: ~450,000 Google searches/month
- **r/FODMAP**: 86,000 members; **r/ibs**: 65,000 members — both highly active, users constantly ask for meal planning help
- **Facebook IBS groups**: 100,000+ members across major groups
- Common complaints about existing apps (from App Store reviews and Reddit):
  - Recipes redirect off-app to third-party sites (not genuinely usable offline)
  - Inundated with ads that can't be closed
  - No real meal planning — just a food database
  - Navigation glitches and reintroduction phase is completely missing
  - Unexpected in-app purchases

### Target Users
- IBS patients following low-FODMAP elimination diet (average 8–12 weeks initial phase)
- IBS patients in reintroduction phase (ongoing, 6–12 months)
- People with SIBO, Crohn's, or other GI conditions using FODMAP as management
- Dietitians and gastroenterologists recommending apps to patients

### Competitor Landscape

| Competitor | Key Weakness | Price |
|---|---|---|
| Monash FODMAP App | Clinical food database only — no meal planning, no recipes | $9.99 one-time |
| FODMAP Friendly | Recipes link out off-app, ads, navigation glitches | Free + IAP |
| FODMAP Snap / SIBO Tracker | Limited recipe content, photo scan focus | Free + IAP |
| Cara Care | Symptom tracker focus; meal planning is weak | $7.99/mo |
| Spoonful | Grocery scanner; not a meal planner | $7.99/mo |

**Key Gap:** No single app does all of: offline recipes + weekly meal plans + shopping list + reintroduction phase tracker + restaurant guide — combined in one clean, ad-free experience.

---

## B. Profit Potential (12-Month Projection)

**Monetization Model:** Paid download + optional premium subscription
- Base app: **$4.99** one-time (includes 100+ recipes, food database, basic meal planner)
- Premium: **$6.99/month** or **$49.99/year** (personalized weekly plans, dietitian Q&A, restaurant guide, reintroduction tracker)

### Conservative Scenario
- Downloads: 20,000 × $4.99 = $99,800 gross → after 30% cut = **$69,860**
- Premium subs: 500 × $6.99/mo = $3,495/mo → $41,940/year
- **Total yr1 net: ~$112K**

### Optimistic Scenario
- Downloads: 60,000 × $4.99 = $299,400 gross → after 30% cut = **$209,580**
- Premium subs: 2,000 × $6.99/mo → $167,760/year → after cut = **$117,432**
- **Total yr1 net: ~$327K**

### Key Retention Advantage
IBS management is lifelong. Unlike fitness apps where users churn after 6 weeks, low-FODMAP users need the app continuously — during elimination (8–12 weeks), reintroduction (6–12 months), and ongoing maintenance. **Retention is structurally strong.**

Dietitian referrals = zero-CAC high-intent installs. Registered dietitians who treat IBS patients consistently recommend apps to every patient — becoming a "dietitian-recommended" app is a flywheel.

---

## C. Marketing Strategy

### Target Audience
- **Demographics:** Adults 25–55, **~2:1 female** (IBS disproportionately affects women), English-speaking markets (US, UK, Australia, Canada)
- **Psychographics:** Health-motivated, frustrated by lack of solutions, willing to pay for things that work, trust medical/dietitian recommendations, active in online health communities

### Acquisition Channels
1. **r/FODMAP (86K) + r/ibs (65K):** Announce app, offer free premium trials for feedback. These communities actively share tool recommendations.
2. **Facebook IBS groups (100K+):** Targeted posts and Facebook ads to IBS interest groups — low CPM, high intent
3. **Registered Dietitian (RD) partnerships:** Email outreach to GI-specializing RDs; offer free premium accounts in exchange for patient recommendations. One active RD can refer 20–50 patients/year.
4. **Gut health / IBS podcasts:** Guest spots on shows like "The Gutsy Podcast," "IBS & Gut Health" — highly targeted, low cost
5. **App Store Optimization (ASO):** "low fodmap meal plan," "IBS diet app," "fodmap recipes" — moderate competition, high intent keywords
6. **Apple Health / Google Fit integration:** Appear in health app ecosystems

### Estimated CAC
- Organic (Reddit/Facebook groups): **$0–2 per install**
- Dietitian referral channel: **$0 CAC** (just free premium accounts)
- Facebook ads to IBS interest segments: **$2–5 per install**
- Podcast guest spots: **~$1–3 per attributed install**

### Launch Strategy
1. Pre-launch: post in r/FODMAP and r/ibs asking for beta testers (target 100 testers)
2. Collect App Store reviews from beta users before public launch
3. Email 50 GI-specializing RDs with a free account offer
4. Guest on 1–2 gut health podcasts in launch week
5. Product Hunt launch on a Tuesday

---

## D. Build Complexity

### MVP Features
- Food database (750+ foods with FODMAP ratings, searchable)
- Recipe library (100+ offline recipes with serving size adjustments)
- Weekly meal planner (drag-and-drop or auto-generate)
- Shopping list generator from meal plan
- Phase tracker (Elimination / Reintroduction / Maintenance)
- Reintroduction tracker (log which foods you've tested and reactions)
- Restaurant guide (safe choices at common restaurant types)
- Offline-first: all content stored on device, no internet required after download

### Tech Stack
- **Frontend:** React Native (iOS + Android, single codebase)
- **Offline storage:** SQLite (recipe/food database bundled with app)
- **Meal plan logic:** Local algorithm, no server needed
- **Backend (minimal):** Supabase for user accounts + cloud sync of meal plans/logs
- **Content:** Partner with a registered dietitian to create/verify 100+ recipes ($2,000–5,000 one-time)

### Realistic Timeline
- Week 1–2: Food database + recipe screens, search + filter
- Week 3–4: Meal planner + shopping list generator
- Week 5–6: Phase tracker, reintroduction log, restaurant guide, offline packaging
- Week 7: Polish, TestFlight/Play beta, App Store submission
- **MVP to launch: ~6–7 weeks**

### One-time Content Cost
Hiring a GI dietitian to verify 100+ recipes and food database accuracy: **$2,000–4,000**. This is a worthwhile investment — "dietitian-verified" is a key trust signal in medical diet apps.

---

## Verdict: ✅ WORTH BUILDING

Massive underserved population, clear and specific competitor gaps, structurally strong retention, and a near-zero CAC channel via dietitian referrals. The paid upfront model means revenue from day one with no user acquisition payback period. Biggest risk: content creation time (recipe writing/verification). Mitigate by hiring a dietitian contractor early.

---

*Sources: Monash FODMAP, App Store reviews for FODMAP Friendly/Snap, casadesante.com low FODMAP app comparison, r/FODMAP community, r/ibs community, healthstandnutrition.com app guide, Global IBS prevalence data*
