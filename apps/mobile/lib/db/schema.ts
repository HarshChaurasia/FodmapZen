export const SCHEMA_SQL = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS foods (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,
  default_serving_g REAL NOT NULL DEFAULT 100,
  fodmap_level      TEXT NOT NULL CHECK (fodmap_level IN ('low','moderate','high','unknown')),
  fructans          TEXT CHECK (fructans IN ('low','moderate','high','unknown')),
  gos               TEXT CHECK (gos IN ('low','moderate','high','unknown')),
  lactose           TEXT CHECK (lactose IN ('low','moderate','high','unknown')),
  fructose          TEXT CHECK (fructose IN ('low','moderate','high','unknown')),
  sorbitol          TEXT CHECK (sorbitol IN ('low','moderate','high','unknown')),
  mannitol          TEXT CHECK (mannitol IN ('low','moderate','high','unknown')),
  serving_note      TEXT,
  tags              TEXT,
  source            TEXT DEFAULT 'monash'
);

CREATE TABLE IF NOT EXISTS food_serving_thresholds (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  food_id     TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  serving_g   REAL NOT NULL,
  fodmap_level TEXT NOT NULL CHECK (fodmap_level IN ('low','moderate','high','unknown')),
  note        TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  meal_type         TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack','dessert','sauce')),
  prep_mins         INTEGER NOT NULL DEFAULT 0,
  cook_mins         INTEGER NOT NULL DEFAULT 0,
  default_servings  INTEGER NOT NULL DEFAULT 2,
  difficulty        TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  calories          REAL,
  protein_g         REAL,
  carbs_g           REAL,
  fat_g             REAL,
  fibre_g           REAL,
  image_url         TEXT,
  is_premium        INTEGER NOT NULL DEFAULT 0,
  phase_compatible  TEXT NOT NULL DEFAULT '["elimination","reintroduction","maintenance"]',
  dietitian_verified INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id   TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id     TEXT REFERENCES foods(id),
  food_name   TEXT NOT NULL,
  amount      REAL NOT NULL,
  unit        TEXT NOT NULL,
  notes       TEXT,
  is_optional INTEGER NOT NULL DEFAULT 0,
  fodmap_level TEXT CHECK (fodmap_level IN ('low','moderate','high','unknown')),
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id    TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number  INTEGER NOT NULL,
  instruction  TEXT NOT NULL,
  image_url    TEXT
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag       TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag)
);

CREATE TABLE IF NOT EXISTS user_profile (
  id                    TEXT PRIMARY KEY DEFAULT 'local',
  supabase_id           TEXT,
  phase                 TEXT NOT NULL DEFAULT 'unknown',
  phase_start_date      TEXT,
  household_size        INTEGER NOT NULL DEFAULT 2,
  preferred_cook_time   TEXT NOT NULL DEFAULT 'any',
  dietary_restrictions  TEXT NOT NULL DEFAULT '[]',
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recipe_favorites (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (recipe_id)
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id          TEXT PRIMARY KEY,
  week_start  TEXT NOT NULL,
  name        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at   TEXT
);

CREATE TABLE IF NOT EXISTS meal_plan_slots (
  id           TEXT PRIMARY KEY,
  meal_plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week  TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  meal_type    TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack','dessert','sauce')),
  recipe_id    TEXT NOT NULL REFERENCES recipes(id),
  servings     INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id                TEXT PRIMARY KEY,
  meal_plan_id      TEXT REFERENCES meal_plans(id) ON DELETE CASCADE,
  food_name         TEXT NOT NULL,
  amount            REAL NOT NULL,
  unit              TEXT NOT NULL,
  shopping_category TEXT NOT NULL DEFAULT 'other',
  is_checked        INTEGER NOT NULL DEFAULT 0,
  is_custom         INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS food_logs (
  id              TEXT PRIMARY KEY,
  date            TEXT NOT NULL,
  recipe_id       TEXT REFERENCES recipes(id),
  custom_food     TEXT,
  notes           TEXT,
  logged_at       TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at       TEXT
);

CREATE TABLE IF NOT EXISTS symptom_logs (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  bloating      INTEGER NOT NULL DEFAULT 0 CHECK (bloating BETWEEN 0 AND 4),
  gas           INTEGER NOT NULL DEFAULT 0 CHECK (gas BETWEEN 0 AND 4),
  pain          INTEGER NOT NULL DEFAULT 0 CHECK (pain BETWEEN 0 AND 4),
  stool_type    INTEGER CHECK (stool_type BETWEEN 1 AND 7),
  stress_level  INTEGER NOT NULL DEFAULT 0 CHECK (stress_level BETWEEN 0 AND 4),
  sleep_quality INTEGER NOT NULL DEFAULT 0 CHECK (sleep_quality BETWEEN 0 AND 4),
  notes         TEXT,
  logged_at     TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at     TEXT
);

CREATE TABLE IF NOT EXISTS reintroduction_tests (
  id             TEXT PRIMARY KEY,
  fodmap_group   TEXT NOT NULL,
  food_tested    TEXT NOT NULL,
  start_date     TEXT NOT NULL,
  day1_reaction  INTEGER CHECK (day1_reaction BETWEEN 0 AND 4),
  day2_reaction  INTEGER CHECK (day2_reaction BETWEEN 0 AND 4),
  day3_reaction  INTEGER CHECK (day3_reaction BETWEEN 0 AND 4),
  final_verdict  TEXT NOT NULL DEFAULT 'pending' CHECK (final_verdict IN ('tolerated','sensitive','avoid','pending')),
  notes          TEXT,
  completed_at   TEXT,
  synced_at      TEXT
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('insert','update','delete')),
  payload     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  attempts    INTEGER NOT NULL DEFAULT 0,
  last_error  TEXT
);

CREATE INDEX IF NOT EXISTS idx_fst_food_id ON food_serving_thresholds(food_id);
CREATE INDEX IF NOT EXISTS idx_ri_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_rs_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_mp_week ON meal_plans(week_start);
CREATE INDEX IF NOT EXISTS idx_mps_plan ON meal_plan_slots(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_fl_date ON food_logs(date);
CREATE INDEX IF NOT EXISTS idx_sl_date ON symptom_logs(date);
CREATE INDEX IF NOT EXISTS idx_outbox_created ON sync_outbox(created_at);
`;
