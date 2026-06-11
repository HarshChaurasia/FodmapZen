import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';
import { FOODS_SEED_SQL } from './seeds/foodsSql';
import { RECIPES_SEED_SQL } from './seeds/recipesSql';

export interface FoodRow {
  id: string;
  name: string;
  category: string;
  default_serving_g: number;
  fodmap_level: 'low' | 'moderate' | 'high' | 'unknown';
  fructans: string | null;
  gos: string | null;
  lactose: string | null;
  fructose: string | null;
  sorbitol: string | null;
  mannitol: string | null;
  serving_note: string | null;
  tags: string | null;
  source: string | null;
}

export interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  meal_type: string;
  prep_mins: number;
  cook_mins: number;
  default_servings: number;
  difficulty: string;
  calories: number | null;
  is_premium: number;
  phase_compatible: string;
  dietitian_verified: number;
  image_url: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('fodmapzen.db');
  return db;
}

// Bump this whenever the bundled food/recipe seed content changes so existing
// installs re-seed the reference tables on next launch.
const SEED_VERSION = 3;

// Guard against concurrent/duplicate invocation (e.g. React effects firing
// twice in dev) — the seed must run exactly once.
let initPromise: Promise<void> | null = null;

export function initializeDatabase(): Promise<void> {
  if (!initPromise) initPromise = doInitializeDatabase();
  return initPromise;
}

async function doInitializeDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(SCHEMA_SQL);
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT);`
  );

  const verRow = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'seed_version'"
  );
  const installedVersion = verRow ? parseInt(verRow.value, 10) : 0;
  const foodCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM foods'
  );
  const isEmpty = !foodCount || foodCount.count === 0;

  if (isEmpty || installedVersion < SEED_VERSION) {
    // Preserve user favourites across a content re-seed (recipes cascade-delete them).
    const favs = await database.getAllAsync<{ recipe_id: string }>(
      'SELECT recipe_id FROM recipe_favorites'
    );

    // Reference tables only — never touches user logs/profile.
    await database.execAsync(`
      DELETE FROM recipe_tags;
      DELETE FROM recipe_steps;
      DELETE FROM recipe_ingredients;
      DELETE FROM food_serving_thresholds;
      DELETE FROM recipes;
      DELETE FROM foods;
    `);

    await database.execAsync(FOODS_SEED_SQL);
    await database.execAsync(RECIPES_SEED_SQL);

    for (const f of favs) {
      await database.runAsync(
        'INSERT OR IGNORE INTO recipe_favorites (recipe_id) VALUES (?)',
        [f.recipe_id]
      );
    }

    await database.runAsync(
      `INSERT INTO app_meta (key, value) VALUES ('seed_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(SEED_VERSION)]
    );
  }
}

export async function searchFoods(
  query: string,
  fodmapFilter?: 'all' | 'low' | 'moderate' | 'high',
  limit = 40
): Promise<FoodRow[]> {
  const database = await getDatabase();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (query.trim()) {
    conditions.push('name LIKE ?');
    params.push(`%${query.trim()}%`);
  }

  if (fodmapFilter && fodmapFilter !== 'all') {
    conditions.push('fodmap_level = ?');
    params.push(fodmapFilter);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);

  return database.getAllAsync<FoodRow>(
    `SELECT * FROM foods ${where} ORDER BY name ASC LIMIT ?`,
    params
  );
}

export async function getFoodById(id: string): Promise<FoodRow | null> {
  const database = await getDatabase();
  return database.getFirstAsync<FoodRow>('SELECT * FROM foods WHERE id = ?', [id]);
}

export async function getFoodThresholds(foodId: string) {
  const database = await getDatabase();
  return database.getAllAsync(
    'SELECT * FROM food_serving_thresholds WHERE food_id = ? ORDER BY serving_g ASC',
    [foodId]
  );
}

export async function getRecipes(filters?: {
  mealType?: string;
  isPremium?: boolean;
  limit?: number;
}): Promise<RecipeRow[]> {
  const database = await getDatabase();
  const limit = filters?.limit ?? 50;
  const premiumCap = filters?.isPremium ? 1 : 0;

  if (filters?.mealType && filters.mealType !== 'all') {
    return database.getAllAsync<RecipeRow>(
      'SELECT * FROM recipes WHERE meal_type = ? AND is_premium <= ? ORDER BY title ASC LIMIT ?',
      [filters.mealType, premiumCap, limit]
    );
  }

  return database.getAllAsync<RecipeRow>(
    'SELECT * FROM recipes WHERE is_premium <= ? ORDER BY title ASC LIMIT ?',
    [premiumCap, limit]
  );
}

export interface RecipeIngredientRow {
  id: number;
  recipe_id: string;
  food_id: string | null;
  food_name: string;
  amount: number;
  unit: string;
  notes: string | null;
  is_optional: number;
  fodmap_level: string | null;
  sort_order: number;
}

export interface RecipeStepRow {
  id: number;
  recipe_id: string;
  step_number: number;
  instruction: string;
  image_url: string | null;
}

export interface RecipeDetail {
  recipe: RecipeRow | null;
  ingredients: RecipeIngredientRow[];
  steps: RecipeStepRow[];
  tags: string[];
}

export async function getRecipeById(id: string): Promise<RecipeDetail> {
  const database = await getDatabase();
  const [recipe, ingredients, steps, tagRows] = await Promise.all([
    database.getFirstAsync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id]),
    database.getAllAsync<RecipeIngredientRow>(
      'SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order',
      [id]
    ),
    database.getAllAsync<RecipeStepRow>(
      'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number',
      [id]
    ),
    database.getAllAsync<{ tag: string }>(
      'SELECT tag FROM recipe_tags WHERE recipe_id = ?',
      [id]
    ),
  ]);
  return { recipe, ingredients, steps, tags: tagRows.map((t) => t.tag) };
}

// ─── ID helper ────────────────────────────────────────────────────────────────

export function generateId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── User profile ───────────────────────────────────────────────────────────

export interface UserProfileRow {
  id: string;
  supabase_id: string | null;
  phase: string;
  phase_start_date: string | null;
  household_size: number;
  preferred_cook_time: string;
  dietary_restrictions: string; // JSON array string
  updated_at: string;
}

export async function getUserProfile(): Promise<UserProfileRow | null> {
  const database = await getDatabase();
  return database.getFirstAsync<UserProfileRow>(
    "SELECT * FROM user_profile WHERE id = 'local'"
  );
}

export async function saveUserProfile(prefs: {
  phase: string;
  phaseStartDate?: string | null;
  householdSize: number;
  preferredCookTime: string;
  dietaryRestrictions: string[];
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO user_profile (id, phase, phase_start_date, household_size, preferred_cook_time, dietary_restrictions, updated_at)
     VALUES ('local', ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       phase = excluded.phase,
       phase_start_date = excluded.phase_start_date,
       household_size = excluded.household_size,
       preferred_cook_time = excluded.preferred_cook_time,
       dietary_restrictions = excluded.dietary_restrictions,
       updated_at = excluded.updated_at`,
    [
      prefs.phase,
      prefs.phaseStartDate ?? null,
      prefs.householdSize,
      prefs.preferredCookTime,
      JSON.stringify(prefs.dietaryRestrictions),
    ]
  );
}

// ─── Food logs ────────────────────────────────────────────────────────────────

export interface FoodLogRow {
  id: string;
  date: string;
  recipe_id: string | null;
  custom_food: string | null;
  notes: string | null;
  logged_at: string;
  synced_at: string | null;
  recipe_title?: string | null;
}

export async function addFoodLog(entry: {
  date?: string;
  recipeId?: string | null;
  customFood?: string | null;
  notes?: string | null;
}): Promise<string> {
  const database = await getDatabase();
  const id = generateId('fl_');
  await database.runAsync(
    `INSERT INTO food_logs (id, date, recipe_id, custom_food, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      entry.date ?? todayISO(),
      entry.recipeId ?? null,
      entry.customFood ?? null,
      entry.notes ?? null,
    ]
  );
  return id;
}

export async function getFoodLogsByDate(date: string): Promise<FoodLogRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<FoodLogRow>(
    `SELECT fl.*, r.title AS recipe_title
     FROM food_logs fl
     LEFT JOIN recipes r ON r.id = fl.recipe_id
     WHERE fl.date = ?
     ORDER BY fl.logged_at DESC`,
    [date]
  );
}

export async function deleteFoodLog(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM food_logs WHERE id = ?', [id]);
}

// ─── Symptom logs ─────────────────────────────────────────────────────────────

export interface SymptomLogRow {
  id: string;
  date: string;
  bloating: number;
  gas: number;
  pain: number;
  stool_type: number | null;
  stress_level: number;
  sleep_quality: number;
  notes: string | null;
  logged_at: string;
  synced_at: string | null;
}

export async function getSymptomLogByDate(date: string): Promise<SymptomLogRow | null> {
  const database = await getDatabase();
  return database.getFirstAsync<SymptomLogRow>(
    'SELECT * FROM symptom_logs WHERE date = ?',
    [date]
  );
}

export async function upsertSymptomLog(entry: {
  date: string;
  bloating: number;
  gas: number;
  pain: number;
  stoolType?: number | null;
  stressLevel: number;
  sleepQuality: number;
  notes?: string | null;
}): Promise<void> {
  const database = await getDatabase();
  const existing = await getSymptomLogByDate(entry.date);
  if (existing) {
    await database.runAsync(
      `UPDATE symptom_logs SET
        bloating = ?, gas = ?, pain = ?, stool_type = ?,
        stress_level = ?, sleep_quality = ?, notes = ?, logged_at = datetime('now')
       WHERE date = ?`,
      [
        entry.bloating, entry.gas, entry.pain, entry.stoolType ?? null,
        entry.stressLevel, entry.sleepQuality, entry.notes ?? null, entry.date,
      ]
    );
  } else {
    await database.runAsync(
      `INSERT INTO symptom_logs (id, date, bloating, gas, pain, stool_type, stress_level, sleep_quality, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId('sl_'), entry.date, entry.bloating, entry.gas, entry.pain,
        entry.stoolType ?? null, entry.stressLevel, entry.sleepQuality, entry.notes ?? null,
      ]
    );
  }
}

export async function getRecentSymptomLogs(limit = 30): Promise<SymptomLogRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<SymptomLogRow>(
    'SELECT * FROM symptom_logs ORDER BY date DESC LIMIT ?',
    [limit]
  );
}

// ─── Recipe favorites ─────────────────────────────────────────────────────────

export async function isFavorite(recipeId: string): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ recipe_id: string }>(
    'SELECT recipe_id FROM recipe_favorites WHERE recipe_id = ?',
    [recipeId]
  );
  return !!row;
}

export async function toggleFavorite(recipeId: string): Promise<boolean> {
  const database = await getDatabase();
  const existing = await isFavorite(recipeId);
  if (existing) {
    await database.runAsync('DELETE FROM recipe_favorites WHERE recipe_id = ?', [recipeId]);
    return false;
  }
  await database.runAsync('INSERT INTO recipe_favorites (recipe_id) VALUES (?)', [recipeId]);
  return true;
}

export async function getFavoriteIds(): Promise<Set<string>> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ recipe_id: string }>(
    'SELECT recipe_id FROM recipe_favorites'
  );
  return new Set(rows.map((r) => r.recipe_id));
}

export async function getFavoriteRecipes(): Promise<RecipeRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecipeRow>(
    `SELECT r.* FROM recipes r
     JOIN recipe_favorites f ON f.recipe_id = r.id
     ORDER BY f.saved_at DESC`
  );
}
