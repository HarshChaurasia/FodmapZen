# FodMap Feast — UI/UX Design Brief
**Date:** 2026-06-10 | **Version:** 1.0

---

## 1. Design Philosophy

### Core Principles
1. **Calm over clinical** — IBS users are anxious about food. The UI must feel warm and reassuring, never hospital-like.
2. **One task per screen** — don't overwhelm. Each screen has one clear primary action.
3. **Progressive disclosure** — show simple first, reveal complexity on demand.
4. **Offline confidence** — no spinners, no "loading..." on core features. Data is local.
5. **Accessibility first** — large tap targets (48×48dp min), high contrast, dynamic type support.

### Anti-patterns to Avoid
- No modal ads or pop-up upgrade prompts mid-task
- No infinite scroll recipe feeds (leads to choice paralysis)
- No red/danger colors for "high FODMAP" foods (negative emotional association)
- No hidden navigation or hamburger menus for primary flows

---

## 2. Design System

### Color Palette
```
Primary Green:     #2D7A4F   (forest green — trust, natural, health)
Light Green:       #E8F5EE   (soft mint — backgrounds, cards)
Accent Orange:     #F4845F   (warm peach — CTAs, highlights, energy)
Accent Yellow:     #F9C74F   (golden — medium-FODMAP indicator)
Alert Red:         #E05C5C   (muted red — high-FODMAP indicator, never harsh)
Background:        #FAFAF7   (warm off-white — not pure white)
Surface:           #FFFFFF   (cards, modals)
Text Primary:      #1A1A1A
Text Secondary:    #6B7280
Text Tertiary:     #9CA3AF
Border:            #E5E7EB
```

### FODMAP Traffic Light System (Redesigned)
Instead of standard red/yellow/green (which can feel alarming), use:
- **Green dot + "Safe"** — low FODMAP at this serving
- **Amber dot + "Caution"** — moderate FODMAP, limited serving
- **Red dot + "Avoid"** — high FODMAP
- **Grey dot + "Not tested"** — data unavailable

Color-blind variant: replace dots with icons (leaf ✓ / tilde ~ / x ✗)

### Typography
```
Font family: DM Sans (Google Fonts — free, rounded, approachable)
  Headings:   DM Sans Bold, 24/20/18/16px
  Body:       DM Sans Regular, 16px, line-height 1.5
  Caption:    DM Sans Regular, 13px, #6B7280
  Numbers:    DM Sans Medium (for servings, calories)
```

### Spacing Scale
```
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
Base unit: 8px
```

### Component Library (React Native + Expo)
- Cards: 12px corner radius, 1px border (#E5E7EB), 8dp shadow
- Buttons: Primary (green fill), Secondary (green outline), Destructive (red outline)
- Bottom sheet: for quick food info, serving size picker
- Tags: small pill shapes for dietary labels (gluten-free, vegan, quick, etc.)
- Progress rings: for reintroduction phase tracking

---

## 3. App Architecture (Navigation)

### Bottom Tab Navigation (5 tabs)
```
[ Home ] [ Recipes ] [ Meal Plan ] [ Tracker ] [ Profile ]
   🏠        🍽️          📅           📊          👤
```

### Screen Map

```
App
├── Onboarding (5 screens — first launch only)
│   ├── Welcome + tagline
│   ├── Phase selection (Elimination / Reintroduction / Maintenance / Not sure)
│   ├── Dietary preferences (vegan, vegetarian, gluten-free, dairy-free, nut allergy)
│   ├── Cooking time preference (< 15 min / 15–30 min / 30+ min fine)
│   └── Account creation (email/Apple/Google) or "Skip for now"
│
├── Home Tab
│   ├── Today's meals (breakfast / lunch / dinner from plan)
│   ├── Phase indicator + days remaining (e.g., "Day 14 of Elimination")
│   ├── Quick actions: Log a meal / Find a recipe / Check a food
│   └── Weekly plan preview (horizontal scroll)
│
├── Recipes Tab
│   ├── Recipe list (filterable: meal type, time, servings, dietary tags)
│   ├── Recipe detail
│   │   ├── Ingredients (each with FODMAP status)
│   │   ├── Step-by-step instructions
│   │   ├── Serving size adjuster (1–6 people, recalculates all amounts)
│   │   ├── Nutrition per serving
│   │   ├── Save to favorites / Add to meal plan
│   │   └── Share recipe (text-only export)
│   └── Favorites (saved recipes)
│
├── Meal Plan Tab
│   ├── Weekly calendar view (Mon–Sun)
│   ├── Each day: breakfast / lunch / dinner / snack slots
│   ├── Auto-generate week (tap to fill from preference-matched recipes)
│   ├── Drag-and-drop slots
│   ├── Shopping list (generated from plan, grouped by section)
│   │   ├── Produce
│   │   ├── Meat & Fish
│   │   ├── Dairy & Alternatives
│   │   ├── Pantry & Dry Goods
│   │   └── Frozen
│   └── Save plan as template / Share plan
│
├── Tracker Tab
│   ├── Food Database (search 500+ foods with FODMAP ratings)
│   │   ├── Search bar with autocomplete
│   │   ├── Serving size slider (changes FODMAP status dynamically)
│   │   └── Add to food log
│   ├── Food Log (daily log of what you've eaten)
│   ├── Symptom Log (gas, bloating, pain, stool type — Bristol scale)
│   ├── Reintroduction Tracker (Premium)
│   │   ├── Current test food + days remaining
│   │   ├── Log reaction for each day
│   │   ├── Past test results (timeline view)
│   │   └── "What to test next" guide
│   └── Phase Timeline (visual progress bar)
│
└── Profile Tab
    ├── Phase settings (change phase, reset timer)
    ├── Dietary preferences
    ├── Subscription status + upgrade CTA
    ├── Restaurant Guide
    │   ├── 15 cuisine types
    │   └── Each: safe dishes, risky dishes, ordering tips
    ├── Export data (PDF)
    ├── Notifications settings
    └── About / Help / Privacy
```

---

## 4. Key Screen Designs

### 4.1 Onboarding Flow

**Screen 1 — Welcome**
```
[Full-screen illustration: colorful FODMAP-safe vegetables in warm tones]
[App Logo — leaf+fork]

"Eat well with IBS. Finally."

Low-FODMAP meal planning that works offline,
no ads, no links out. Just real food, real plans.

[Get Started →]
[I already have an account]
```

**Screen 2 — Phase Selection**
```
"Where are you in your FODMAP journey?"

[Card: 🌿 Starting Elimination]
"New to FODMAP or restarting.
I need recipes and a meal plan."

[Card: 🔬 In Reintroduction]
"I've done elimination.
Time to test foods systematically."

[Card: 🍽️ Ongoing Management]
"I know my triggers.
I need variety and restaurant tips."

[Card: ❓ Not Sure]
"I've heard about FODMAP.
Help me understand first."
```

**Screen 3 — Preferences**
```
"Any dietary requirements?"
(Multi-select chips)
[ Vegetarian ] [ Vegan ] [ Gluten-Free ]
[ Dairy-Free ] [ Nut Allergy ] [ Egg-Free ]

"How much time to cook?"
○ Under 15 minutes
○ 15–30 minutes
● Whatever it takes (I love cooking)
```

**Screen 4 — Account (Optional)**
```
"Save your progress across devices"

[Continue with Apple]
[Continue with Google]
[Continue with Email]

[Skip for now — I'll use offline only]
```

**Screen 5 — Ready**
```
[Animated: meal plan filling in for the week]

"Your FODMAP journey starts now."

Here's what's ready for you:
✓ 30 offline recipes to start
✓ Your personalized meal plan
✓ Phase tracker (Day 1 of Elimination)

[Start Exploring →]
```

---

### 4.2 Home Tab

```
┌─────────────────────────────────────┐
│  Good morning, Sarah 👋              │
│  Day 14 of Elimination ──────── 🌿  │
│  26 days remaining                  │
├─────────────────────────────────────┤
│  TODAY'S MEALS                      │
│  ┌──────────┐ ┌──────────┐          │
│  │Overnight │ │Quinoa    │          │
│  │Oats      │ │Salad     │          │
│  │Breakfast │ │Lunch     │          │
│  └──────────┘ └──────────┘          │
│  ┌──────────────────────────┐       │
│  │ Lemon Herb Chicken       │       │
│  │ Dinner  · 25 min  · 4★  │       │
│  └──────────────────────────┘       │
├─────────────────────────────────────┤
│  QUICK ACTIONS                      │
│  [🍽 Find Recipe] [🔍 Check Food]    │
│  [📝 Log Meal]   [🛒 Shopping List] │
├─────────────────────────────────────┤
│  THIS WEEK AT A GLANCE              │
│  Mon Tue Wed Thu Fri Sat Sun        │
│  ✓   ✓   ·   ·   ·   ·   ·        │
└─────────────────────────────────────┘
```

---

### 4.3 Recipe Card & Detail

**Recipe Card (List View)**
```
┌────────────────────────────────────┐
│ [food photo]          [❤ save]     │
│ Lemon Herb Baked Salmon            │
│ ⏱ 25 min  👥 2 servings  ⭐ Easy  │
│ 🏷 Dinner · Gluten-Free · Dairy-Free│
└────────────────────────────────────┘
```

**Recipe Detail Screen**
```
[Hero image — full width, 220px tall]
[Back ←]                    [❤ Save] [+ Add to Plan]

Lemon Herb Baked Salmon
⏱ 25 min prep + cook  |  👥 2 servings  |  ⭐ Easy

[1]─[2]─[3]─[4] (Serving adjuster)

INGREDIENTS
● 2 salmon fillets (180g each)    ✓ Safe
● 2 tbsp olive oil               ✓ Safe
● 1 tbsp lemon juice             ✓ Safe
● 2 tsp chives, chopped          ✓ Safe (2 tbsp max)
● ½ tsp garlic-infused oil       ✓ Safe [ℹ️ why no garlic?]

INSTRUCTIONS
Step 1 of 5
Preheat oven to 200°C / 180°C fan / Gas Mark 6.

[← Previous]              [Next Step →]

NUTRITION (per serving)
Cal: 380  |  Protein: 35g  |  Carbs: 2g  |  Fat: 25g

[Add to Today's Meal Plan]
```

---

### 4.4 Meal Planner

```
┌─────────────────────────────────────┐
│  WEEK OF JUNE 10          [Auto-Fill] │
├────┬────┬────┬────┬────┬────┬────┤
│Mon │Tue │Wed │Thu │Fri │Sat │Sun │
├────┴────┴────┴────┴────┴────┴────┤
│ BREAKFAST                          │
│ [Overnight Oats]  [+ Add]          │
├────────────────────────────────────┤
│ LUNCH                              │
│ [Quinoa Salad]  [Tuna Rice]        │
├────────────────────────────────────┤
│ DINNER                             │
│ [Herb Chicken] [Salmon] [+ Add]    │
├────────────────────────────────────┤
│ 📊 This week: 18/21 meals planned  │
│ [View Shopping List →]             │
└─────────────────────────────────────┘
```

---

### 4.5 Reintroduction Tracker (Premium)

```
PHASE 2: REINTRODUCTION
Testing food group by food group

CURRENT TEST: Lactose
Day 2 of 3   ████████░░  

How are you feeling today?
○ No symptoms
○ Mild (tolerable)
○ Moderate
● Severe

Notes: _______________

[Save Today's Log]

PAST TESTS
Fructans (Wheat)    ✗ Sensitive — avoid
Fructose (Honey)    ✓ Tolerated — add to safe list
GOS (Chickpeas)     ✓ Tolerated in small amounts
Lactose             ⏳ Testing now

[View Full Timeline] [Export Report PDF]
```

---

### 4.6 Food Database / Checker

```
🔍 Search foods...

RESULTS FOR "APPLE"

Apple, raw (regular)
Large serving (150g)  ●●●  HIGH FODMAP
Small serving (60g)   ●○○  LOW FODMAP ✓
[Use in Recipe]  [Add to Log]

Apple, green Granny Smith
Any serving (100g)    ●○○  LOW FODMAP ✓
[Use in Recipe]  [Add to Log]

─────────────────────────────────────
ℹ️ Serving size matters!
Many fruits are safe in small amounts.
The slider below adjusts FODMAP status.

[──────●──────] 80g
```

---

## 5. Upgrade Prompts (Non-Intrusive)

### Contextual Upgrade (in-line, not modal)
When a free user taps a locked feature:
```
┌──────────────────────────────────────┐
│ 🔒 Meal Planner — Premium Feature    │
│                                      │
│ Plan your whole week in one tap.     │
│ Auto-generate meals, build your      │
│ shopping list, and never wonder      │
│ "what's for dinner?" again.          │
│                                      │
│ [Start 14-Day Free Trial]            │
│ [See All Premium Features]           │
│                                      │
│ Already have premium? [Sign in]      │
└──────────────────────────────────────┘
```

**No full-screen modal.** This is a half-sheet that slides up from the bottom, dismissible by swiping down.

---

## 6. Website Design

### Marketing Site Structure (Next.js)
```
/ (Home)
├── /features
├── /pricing
├── /recipes (SEO blog: free recipe index)
├── /blog (content marketing: FODMAP guides)
├── /restaurant-guide (free SEO page)
├── /for-dietitians (B2B landing page)
├── /download (app download page with QR codes)
└── /account (web dashboard — Premium users)
    ├── /account/meal-plan
    ├── /account/recipes
    ├── /account/tracker
    └── /account/shopping-list
```

### Homepage Hero Section
```
[Nav: Logo | Features | Pricing | Blog | Download App →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Left: Text]                [Right: App screenshot mockup]
"Eat well with IBS.
Finally."

Your complete low-FODMAP companion:
200+ offline recipes, weekly meal plans,
auto shopping lists, and a guided
reintroduction tracker.

No ads. No internet required.
Dietitian-verified.

[Download on App Store]  [Get on Google Play]

★★★★★ 4.8/5 — 2,400 reviews
"The only FODMAP app I've ever stuck with"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Website Color Theme: Same as app (green/cream/peach)

---

## 7. Accessibility Checklist

- [ ] All text meets WCAG AA contrast (4.5:1 minimum)
- [ ] Minimum tap target: 48×48dp
- [ ] VoiceOver / TalkBack labels on all interactive elements
- [ ] Dynamic Type support (iOS) / font scaling (Android)
- [ ] Colorblind mode for FODMAP traffic light system
- [ ] No information conveyed by color alone
- [ ] All images have alt text
- [ ] Focus order is logical on all screens

---

## 8. Design Deliverables Required

Before development starts, the following must be created:

| Deliverable | Tool | Priority |
|---|---|---|
| Component library (colors, type, components) | Figma | P0 |
| Onboarding flow (5 screens, annotated) | Figma | P0 |
| Home tab (all states: empty, partial, full) | Figma | P0 |
| Recipe list + detail screens | Figma | P0 |
| Meal planner (weekly view) | Figma | P0 |
| Food database / checker | Figma | P0 |
| Reintroduction tracker (3 states) | Figma | P1 |
| Upgrade prompts (3 variants) | Figma | P1 |
| Marketing website (desktop + mobile) | Figma | P1 |
| App Store screenshots (6 × iPhone 15 Pro) | Figma | P0 |
| App icon (1024×1024 + adaptive) | Illustrator/Figma | P0 |
