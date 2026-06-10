# FodMap Feast — Product Strategy
**Date:** 2026-06-10 | **Version:** 1.0

---

## 1. Product Vision

**"The only FODMAP app you'll need from day one of elimination through years of maintenance — fully offline, no ads, no link-outs."**

FodMap Feast closes the gap between knowing what to eat (food lookup) and actually eating it (planning, shopping, cooking). It guides users through all three phases of the low-FODMAP journey with a clean, approachable interface designed for people who are already stressed by their condition.

---

## 2. Three-Tier Model

### Tier 1 — Free (Ad-Supported)
**Purpose:** Acquisition funnel. Let users experience the quality before paying.

**Included:**
- Food database: 500 foods with FODMAP traffic-light ratings
- Recipe library: 30 curated offline recipes (no link-outs)
- Basic food search with filters (high/low/moderate FODMAP)
- Elimination phase introduction + checklist
- Daily food log (7-day history only)
- Banner ads (non-intrusive, bottom of screen only)
- App review prompt at Day 7 (to seed App Store ratings)

**Locked (upgrade prompt):**
- Full recipe library, meal planner, shopping list, reintroduction tracker, restaurant guide, cloud sync

**Conversion Strategy:** The free tier is genuinely useful but intentionally shows users what they're missing. The upgrade CTA appears contextually (e.g., "Plan your whole week — upgrade to Premium").

---

### Tier 2 — Ad-Free (One-Time Purchase: $2.99)
**Purpose:** Low-friction upsell for users who hate ads but aren't ready for full commitment.

**Included:**
- Everything in Free tier
- All banner ads removed
- Recipe library expanded to 75 recipes
- 30-day food log history
- Phase tracker (Elimination + basic Reintroduction checklist)

**Not Included:**
- Weekly meal planner, auto shopping list, full reintroduction tracker, restaurant guide, cloud sync

**Rationale:** $2.99 removes friction for ad-haters, generates immediate revenue, and keeps users in-app long enough to convert to Premium. One-time purchase respects users who dislike subscriptions.

---

### Tier 3 — Premium (Subscription: $7.99/month or $59.99/year)
**Purpose:** Core revenue driver. Full FODMAP companion.

**Included (everything in Ad-Free, plus):**
- Full recipe library: 200+ dietitian-verified offline recipes
  - Breakfast, lunch, dinner, snacks, desserts, drinks
  - Serving size adjustments (1–6 people)
  - Nutrition info per serving
  - Prep time, cook time, difficulty tags
- Weekly meal planner
  - Auto-generate a full week from preferences (dietary restrictions, servings, prep time)
  - Drag-and-drop to customize
  - Save and reuse favorite weekly plans
- Shopping list generator
  - Auto-generated from meal plan
  - Grouped by supermarket section (produce, dairy, etc.)
  - Checkoff items as you shop
  - Share list via text/WhatsApp
- Full reintroduction tracker
  - Guided protocol (Monash-aligned 3-day testing windows)
  - Log reactions: none / mild / moderate / severe
  - Visual timeline of tested foods
  - Export reintroduction report (PDF) to share with dietitian
- Maintenance phase tools
  - Personal "safe list" of tolerated foods
  - Personalized recipe filters based on your tolerances
- Restaurant guide
  - Safe choices at 15+ restaurant types (Italian, Thai, Mexican, Indian, fast food, etc.)
  - Ordering tips, ingredient swaps, what to avoid
  - Printable/shareable "safe choices" card
- Full symptom + food diary
  - Log meals, symptoms, stress, sleep, bowel movements
  - Pattern identification (weekly summary)
- Cloud sync across devices (iOS ↔ Android ↔ Web)
- Priority in-app support
- Early access to new recipes and features

**Pricing Justification:**
- Monash App: $9.99 one-time (no meal planning)
- Cara Care: $7.99/month (symptom focus only)
- FodMap Feast: $7.99/month or $59.99/year (~$5/month) = better value than both with more features

---

### Tier 4 — Premium+ / Dietitian Add-On (Optional: $14.99/month or bundled)
**Purpose:** High-ticket upsell for users who want professional guidance.

**Included (everything in Premium, plus):**
- Monthly 30-minute live Q&A with a registered GI dietitian (group session, 10 users max)
- Unlimited async chat with dietitian (48-hour response SLA)
- Personalized meal plan created by dietitian (one-time at onboarding)
- Priority reintroduction review (dietitian reviews your log and gives feedback)

**Implementation Note:** This tier is Phase 3+. Requires contracting 2–3 RDs on a part-time basis. Can be launched as a waitlist in Phase 1 to gauge demand.

---

## 3. Feature Prioritization Matrix

### Must Have (MVP — Phase 1)
- [ ] Food database (500+ foods, searchable, filterable)
- [ ] Recipe library (30 free / 100 premium, offline)
- [ ] Phase tracker (Elimination / Reintroduction / Maintenance)
- [ ] Basic food log
- [ ] User authentication (Supabase Auth)
- [ ] Subscription management (RevenueCat)
- [ ] Onboarding flow (5 screens, phase selection)
- [ ] App Store + Play Store submission

### Should Have (Phase 2 — Post-Launch Polish)
- [ ] Weekly meal planner
- [ ] Shopping list generator
- [ ] Full reintroduction tracker with guided protocol
- [ ] Restaurant guide (15 restaurant types)
- [ ] Cloud sync across devices
- [ ] Symptom diary

### Nice to Have (Phase 3 — Growth)
- [ ] Barcode scanner (for packaged goods)
- [ ] Dietitian Q&A integration
- [ ] PDF export (reintroduction report, shopping list)
- [ ] Apple Health / Google Fit integration
- [ ] Web app dashboard (view meal plans, log from browser)
- [ ] Push notification reminders (meal times, reintroduction testing schedule)
- [ ] Community forum or recipe ratings

### Deferred (Phase 4+)
- [ ] AI meal plan personalization
- [ ] Wearable integration (symptom correlation with activity/sleep)
- [ ] Multi-language support (Spanish, French, German)
- [ ] Dietitian dashboard (B2B SaaS for RDs to manage patients)

---

## 4. Platform Strategy

### Phase 1: Mobile First
- **iOS** (App Store) — primary, IBS users skew toward Apple devices
- **Android** (Google Play) — parallel development via React Native

### Phase 2: Web Dashboard
- **Web App** (Next.js) — view/edit meal plans, access recipes, log symptoms from desktop
- **Marketing Website** (Next.js) — landing page, pricing, blog (SEO), waitlist

### Phase 3: Web Parity
- Full feature parity between mobile and web
- PWA (Progressive Web App) for mobile web users

---

## 5. Content Strategy

### Recipe Library Build Plan
**Target:** 200 verified recipes for Premium launch

**Categories:**
- Breakfast: 35 recipes
- Lunch: 40 recipes
- Dinner: 50 recipes
- Snacks: 30 recipes
- Desserts: 25 recipes
- Sauces & Condiments: 20 recipes

**Quality Standard:** Each recipe must:
1. Use only low-FODMAP ingredients at listed serving sizes
2. Include complete ingredient list with FODMAP-safe portions
3. Have been reviewed by a registered dietitian
4. Include: prep time, cook time, servings, calories, macros, difficulty level
5. Be photographed (or have a high-quality stock illustration)

**Estimated Content Cost:** $3,000–$5,000 for dietitian verification + $1,000–$2,000 for food photography

### Food Database
**Target:** 750+ foods (matching Monash coverage)
**Source:** Monash University's published research (open access), combined with FODMAP Friendly certified products
**Enhancement:** Serving size adjustments — same food can be green/yellow/red depending on serving size (this is how FODMAP works and most apps get this wrong)

---

## 6. Monetization Projections

### Year 1 — Conservative
| Stream | Volume | Revenue |
|---|---|---|
| Free tier (ads) | 15,000 MAU | $1,500/mo ($18K/yr) |
| Ad-Free purchases | 3,000 × $2.99 | $8,970 |
| Premium monthly | 800 × $7.99/mo | $6,392/mo → $76,704/yr |
| Premium annual | 200 × $59.99 | $11,998 |
| **Total gross (yr1)** | | **~$115,672** |
| After 30% store cut | | **~$80,970** |

### Year 1 — Optimistic
| Stream | Volume | Revenue |
|---|---|---|
| Free tier (ads) | 40,000 MAU | $4,000/mo ($48K/yr) |
| Ad-Free purchases | 8,000 × $2.99 | $23,920 |
| Premium monthly | 2,500 × $7.99/mo | $19,975/mo → $239,700/yr |
| Premium annual | 500 × $59.99 | $29,995 |
| **Total gross (yr1)** | | **~$341,615** |
| After 30% store cut | | **~$239,130** |

---

## 7. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Monash University adds meal planning to their app | Low | High | Build community + content moat; dietitian Q&A differentiator |
| Recipe verification delays | Medium | Medium | Hire dietitian contractor Month 1; build 30 free-tier recipes in-house first |
| App Store rejection | Low | Medium | Follow App Store health app guidelines; avoid medical claims |
| Low free→premium conversion | Medium | High | Ensure free tier is genuinely useful; nail onboarding; in-context upgrade CTAs |
| Android performance issues | Medium | Low | Test SQLite performance early; use FTS5 for search |
| FODMAP science updates | Low | Medium | Partner with dietitian who follows Monash updates |

---

## 8. Success Metrics (Year 1 KPIs)

| Metric | Target |
|---|---|
| Total downloads | 25,000+ |
| Free → Paid conversion rate | ≥ 8% |
| Monthly Active Users (MAU) | ≥ 15,000 |
| Day-30 retention | ≥ 35% |
| App Store rating | ≥ 4.5 stars |
| Premium churn (monthly) | ≤ 5% |
| Dietitian partnerships | ≥ 10 active RDs |
| App Store reviews | ≥ 500 (by Month 3) |
