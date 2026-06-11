import { getDatabase, generateId, getUserProfile, type RecipeRow } from './database';

export type PlannerMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const PLANNER_MEAL_TYPES: PlannerMealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;
export type PlannerDay = (typeof DAYS_OF_WEEK)[number];

export interface MealPlanRow {
  id: string;
  week_start: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlotRow {
  id: string;
  meal_plan_id: string;
  day_of_week: PlannerDay;
  meal_type: string;
  recipe_id: string;
  servings: number;
  recipe_title?: string;
  prep_mins?: number;
  cook_mins?: number;
  calories?: number | null;
}

/** Monday of the week containing `date`, as YYYY-MM-DD. */
export function weekStartISO(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function getOrCreatePlan(weekStart: string): Promise<MealPlanRow> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<MealPlanRow>(
    'SELECT * FROM meal_plans WHERE week_start = ?',
    [weekStart]
  );
  if (existing) return existing;
  const id = generateId('mp_');
  await db.runAsync('INSERT INTO meal_plans (id, week_start) VALUES (?, ?)', [id, weekStart]);
  return (await db.getFirstAsync<MealPlanRow>('SELECT * FROM meal_plans WHERE id = ?', [id]))!;
}

export async function getSlots(mealPlanId: string): Promise<SlotRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<SlotRow>(
    `SELECT s.*, r.title AS recipe_title, r.prep_mins, r.cook_mins, r.calories
     FROM meal_plan_slots s
     JOIN recipes r ON r.id = s.recipe_id
     WHERE s.meal_plan_id = ?`,
    [mealPlanId]
  );
}

export async function setSlot(
  mealPlanId: string,
  day: PlannerDay,
  mealType: PlannerMealType,
  recipeId: string,
  servings: number
): Promise<void> {
  const db = await getDatabase();
  // One recipe per day+meal slot — replace any existing entry.
  await db.runAsync(
    'DELETE FROM meal_plan_slots WHERE meal_plan_id = ? AND day_of_week = ? AND meal_type = ?',
    [mealPlanId, day, mealType]
  );
  await db.runAsync(
    `INSERT INTO meal_plan_slots (id, meal_plan_id, day_of_week, meal_type, recipe_id, servings)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId('mps_'), mealPlanId, day, mealType, recipeId, servings]
  );
  await touchPlan(mealPlanId);
}

export async function removeSlot(slotId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_plan_slots WHERE id = ?', [slotId]);
}

export async function clearWeek(mealPlanId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_plan_slots WHERE meal_plan_id = ?', [mealPlanId]);
  await touchPlan(mealPlanId);
}

async function touchPlan(mealPlanId: string) {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE meal_plans SET updated_at = datetime('now') WHERE id = ?",
    [mealPlanId]
  );
}

// ─── Auto-generate ────────────────────────────────────────────────────────────

interface CandidateRecipe extends RecipeRow {
  tags: string[];
}

const RESTRICTION_TAG: Record<string, string> = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  'gluten-free': 'gluten-free',
  'dairy-free': 'dairy-free',
  'nut-free': 'nut-free',
  'egg-free': 'egg-free',
};

async function getCandidates(mealType: PlannerMealType): Promise<CandidateRecipe[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RecipeRow>(
    'SELECT * FROM recipes WHERE meal_type = ?',
    [mealType]
  );
  const result: CandidateRecipe[] = [];
  for (const r of rows) {
    const tagRows = await db.getAllAsync<{ tag: string }>(
      'SELECT tag FROM recipe_tags WHERE recipe_id = ?',
      [r.id]
    );
    result.push({ ...r, tags: tagRows.map((t) => t.tag) });
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Fills all 7 days × (breakfast/lunch/dinner + optional snack) honoring:
 *  - user dietary restrictions (recipe must carry the matching tag)
 *  - phase compatibility (elimination users only get elimination-safe recipes)
 *  - no recipe repeated within 3 days for the same meal type
 *  - preferred cook time ("quick" users get <=20 min total where possible)
 */
export async function autoGenerateWeek(mealPlanId: string): Promise<number> {
  const profile = await getUserProfile();
  const phase = profile?.phase ?? 'unknown';
  const restrictions: string[] = profile ? JSON.parse(profile.dietary_restrictions || '[]') : [];
  const servings = profile?.household_size ?? 2;
  const prefersQuick = profile?.preferred_cook_time === 'quick';

  const db = await getDatabase();
  await db.runAsync('DELETE FROM meal_plan_slots WHERE meal_plan_id = ?', [mealPlanId]);

  let filled = 0;
  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as PlannerMealType[]) {
    let candidates = await getCandidates(mealType);

    if (phase === 'elimination') {
      candidates = candidates.filter((c) => c.phase_compatible.includes('elimination'));
    }
    for (const r of restrictions) {
      const tag = RESTRICTION_TAG[r];
      if (tag) candidates = candidates.filter((c) => c.tags.includes(tag));
    }
    if (candidates.length === 0) continue;

    // Quick-cook preference is soft: prefer quick recipes but fall back to all.
    let pool = candidates;
    if (prefersQuick) {
      const quick = candidates.filter((c) => (c.prep_mins ?? 0) + (c.cook_mins ?? 0) <= 20);
      if (quick.length >= 3) pool = quick;
    }

    const order = shuffle(pool);
    const recent: string[] = []; // last-3-days window for this meal type
    for (let dayIdx = 0; dayIdx < DAYS_OF_WEEK.length; dayIdx++) {
      let pick = order[dayIdx % order.length];
      if (recent.includes(pick.id)) {
        const alt = order.find((c) => !recent.includes(c.id));
        if (alt) pick = alt;
      }
      await db.runAsync(
        `INSERT INTO meal_plan_slots (id, meal_plan_id, day_of_week, meal_type, recipe_id, servings)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [generateId('mps_'), mealPlanId, DAYS_OF_WEEK[dayIdx], mealType, pick.id, servings]
      );
      filled++;
      recent.push(pick.id);
      if (recent.length > 2) recent.shift();
      // rotate the order so consecutive days differ even with tiny pools
      order.push(order.shift()!);
    }
  }
  await touchPlan(mealPlanId);
  return filled;
}

// ─── Shopping list ────────────────────────────────────────────────────────────

export interface ShoppingItemRow {
  id: string;
  meal_plan_id: string | null;
  food_name: string;
  amount: number;
  unit: string;
  shopping_category: string;
  is_checked: number;
  is_custom: number;
}

export const SHOPPING_SECTIONS = [
  'produce', 'meat-fish', 'dairy-alternatives', 'pantry', 'frozen', 'other',
] as const;

export const SECTION_LABELS: Record<string, string> = {
  produce: '🥬 Produce',
  'meat-fish': '🍗 Meat & Fish',
  'dairy-alternatives': '🥛 Dairy & Alternatives',
  pantry: '🥫 Pantry',
  frozen: '🧊 Frozen',
  other: '🛒 Other',
};

const CATEGORY_TO_SECTION: Record<string, string> = {
  fruit: 'produce',
  vegetable: 'produce',
  'herb-spice': 'produce',
  protein: 'meat-fish',
  dairy: 'dairy-alternatives',
  'dairy-alternative': 'dairy-alternatives',
  grain: 'pantry',
  legume: 'pantry',
  'nut-seed': 'pantry',
  condiment: 'pantry',
  sweetener: 'pantry',
  beverage: 'pantry',
  snack: 'pantry',
};

// Seed recipe ingredients often have no food_id, so classify by name keywords.
const SECTION_KEYWORDS: [string, string[]][] = [
  ['frozen', ['frozen']],
  // checked before dairy so "peanut butter" / "coconut milk" don't match butter/milk
  ['pantry', ['peanut', 'almond butter', 'coconut milk', 'coconut cream', 'coconut yoghurt']],
  ['produce', [
    'spinach', 'tomato', 'carrot', 'cucumber', 'banana', 'berr', 'lemon', 'lime', 'orange',
    'zucchini', 'capsicum', 'pumpkin', 'potato', 'bok choy', 'basil', 'mint', 'parsley',
    'dill', 'chive', 'rosemary', 'thyme', 'coriander', 'ginger', 'spring onion', 'lettuce',
    'kale', 'eggplant', 'green bean', 'grape', 'kiwi', 'pineapple', 'avocado', 'salad',
    'cabbage', 'broccoli', 'pak choy', 'radish', 'celeriac', 'parsnip', 'swede', 'turnip',
    'mandarin', 'melon', 'papaya', 'passionfruit', 'rhubarb', 'fennel bulb', 'bean sprout',
  ]],
  ['meat-fish', [
    'chicken', 'beef', 'pork', 'lamb', 'salmon', 'fish', 'prawn', 'shrimp', 'tuna',
    'turkey', 'bacon', 'mince', 'steak', 'fillet',
  ]],
  ['dairy-alternatives', [
    'milk', 'yoghurt', 'yogurt', 'cheese', 'mozzarella', 'cheddar', 'feta', 'parmesan',
    'butter', 'cream', 'lactose-free', 'egg',
  ]],
];

function classifySection(name: string, category: string | null): string {
  const lower = name.toLowerCase();
  for (const [section, words] of SECTION_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return section;
  }
  if (category && CATEGORY_TO_SECTION[category]) return CATEGORY_TO_SECTION[category];
  return 'pantry';
}

/** Merge "Carrots" with "Carrot" etc. — naive singular for the aggregation key only. */
function nameKey(name: string): string {
  const lower = name.trim().toLowerCase();
  return lower.length > 3 && lower.endsWith('s') && !lower.endsWith('ss')
    ? lower.slice(0, -1)
    : lower;
}

/** Convert teaspoons/cups to tablespoons so the same ingredient aggregates across units. */
function toCanonicalUnit(amount: number, unit: string): { amount: number; unit: string } {
  const u = unit.toLowerCase();
  if (u === 'tsp') return { amount: amount / 3, unit: 'tbsp' };
  if (u === 'cup' || u === 'cups') return { amount: amount * 16, unit: 'tbsp' };
  return { amount, unit };
}

/** Round to shopper-friendly quantities and pick a readable display unit. */
function displayAmount(amount: number, unit: string): { amount: number; unit: string } {
  const roundTo = (v: number, step: number) => Math.max(step, Math.round(v / step) * step);
  if (unit === 'tbsp') {
    if (amount >= 12) return { amount: Math.round((amount / 16) * 4) / 4 || 0.25, unit: 'cup' };
    if (amount < 1) return { amount: roundTo(amount * 3, 0.5), unit: 'tsp' };
    return { amount: roundTo(amount, 0.5), unit: 'tbsp' };
  }
  if (unit === 'g' || unit === 'ml') {
    return { amount: roundTo(amount, amount < 100 ? 5 : 10), unit };
  }
  if (['pinch'].includes(unit)) return { amount: Math.ceil(amount), unit };
  // countable things — round up to halves so the shopper never under-buys
  return { amount: Math.ceil(amount * 2) / 2, unit };
}

/** Rebuilds generated items for the plan; user-added custom items are kept. */
export async function generateShoppingList(mealPlanId: string): Promise<number> {
  const db = await getDatabase();

  // Preserve checked state of previously generated items by name+unit.
  const prior = await db.getAllAsync<ShoppingItemRow>(
    'SELECT * FROM shopping_items WHERE meal_plan_id = ? AND is_custom = 0',
    [mealPlanId]
  );
  const checkedKeys = new Set(
    prior.filter((p) => p.is_checked).map((p) => `${nameKey(p.food_name)}|${p.unit}`)
  );
  await db.runAsync(
    'DELETE FROM shopping_items WHERE meal_plan_id = ? AND is_custom = 0',
    [mealPlanId]
  );

  const rows = await db.getAllAsync<{
    food_name: string;
    unit: string;
    amount: number;
    servings: number;
    default_servings: number;
    category: string | null;
  }>(
    `SELECT ri.food_name, ri.unit, ri.amount, s.servings, r.default_servings, f.category
     FROM meal_plan_slots s
     JOIN recipes r ON r.id = s.recipe_id
     JOIN recipe_ingredients ri ON ri.recipe_id = r.id
     LEFT JOIN foods f ON f.id = ri.food_id
     WHERE s.meal_plan_id = ? AND ri.is_optional = 0`,
    [mealPlanId]
  );

  const agg = new Map<string, { name: string; unit: string; amount: number; section: string }>();
  for (const row of rows) {
    const scale = row.default_servings > 0 ? row.servings / row.default_servings : 1;
    const canonical = toCanonicalUnit(row.amount * scale, row.unit);
    const key = `${nameKey(row.food_name)}|${canonical.unit.toLowerCase()}`;
    const entry = agg.get(key);
    if (entry) entry.amount += canonical.amount;
    else {
      agg.set(key, {
        name: row.food_name,
        unit: canonical.unit,
        amount: canonical.amount,
        section: classifySection(row.food_name, row.category),
      });
    }
  }

  for (const item of agg.values()) {
    const display = displayAmount(item.amount, item.unit);
    await db.runAsync(
      `INSERT INTO shopping_items (id, meal_plan_id, food_name, amount, unit, shopping_category, is_checked, is_custom)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        generateId('si_'),
        mealPlanId,
        item.name,
        display.amount,
        display.unit,
        item.section,
        checkedKeys.has(`${nameKey(item.name)}|${display.unit}`) ? 1 : 0,
      ]
    );
  }
  return agg.size;
}

export async function getShoppingItems(mealPlanId: string): Promise<ShoppingItemRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<ShoppingItemRow>(
    `SELECT * FROM shopping_items WHERE meal_plan_id = ?
     ORDER BY shopping_category, food_name COLLATE NOCASE`,
    [mealPlanId]
  );
}

export async function toggleShoppingItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE shopping_items SET is_checked = 1 - is_checked WHERE id = ?', [id]);
}

export async function addCustomShoppingItem(mealPlanId: string, name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO shopping_items (id, meal_plan_id, food_name, amount, unit, shopping_category, is_checked, is_custom)
     VALUES (?, ?, ?, 1, 'x', 'other', 0, 1)`,
    [generateId('si_'), mealPlanId, name.trim()]
  );
}

export async function clearCompletedItems(mealPlanId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM shopping_items WHERE meal_plan_id = ? AND is_checked = 1',
    [mealPlanId]
  );
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM shopping_items WHERE id = ?', [id]);
}

/** Plain-text export for the Share API. */
export function formatShoppingListText(items: ShoppingItemRow[]): string {
  const bySection = new Map<string, ShoppingItemRow[]>();
  for (const item of items) {
    const list = bySection.get(item.shopping_category) ?? [];
    list.push(item);
    bySection.set(item.shopping_category, list);
  }
  const lines: string[] = ['FodmapZen Shopping List', ''];
  for (const section of SHOPPING_SECTIONS) {
    const list = bySection.get(section);
    if (!list?.length) continue;
    lines.push(SECTION_LABELS[section] ?? section);
    for (const item of list) {
      const qty = item.is_custom ? '' : ` — ${item.amount} ${item.unit}`;
      lines.push(`${item.is_checked ? '✓' : '•'} ${item.food_name}${qty}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}
