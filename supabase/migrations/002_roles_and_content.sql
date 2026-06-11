-- FodmapZen — Roles + Content Management tables
-- Adds: user roles, dietitian-editable content tables (master copy of the
-- bundled mobile seed data), with review workflow (draft -> approved).
-- Run via: supabase db push

-- ─────────────────────────────────────────────────────────────────────────────
-- Roles
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'dietitian', 'admin'));

-- Helper: current user's role (SECURITY DEFINER so RLS on user_profiles
-- doesn't block the lookup from other tables' policies).
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'anon'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_content_editor()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT public.user_role() IN ('dietitian', 'admin');
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Content: Foods
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_foods (
  id                TEXT PRIMARY KEY,           -- category-prefixed id (matches mobile seeds)
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,
  default_serving_g NUMERIC NOT NULL DEFAULT 100,
  fodmap_level      TEXT NOT NULL DEFAULT 'unknown'
                    CHECK (fodmap_level IN ('low','moderate','high','unknown')),
  fructans          TEXT,
  gos               TEXT,
  lactose           TEXT,
  fructose          TEXT,
  sorbitol          TEXT,
  mannitol          TEXT,
  serving_note      TEXT,
  tags              JSONB NOT NULL DEFAULT '[]',
  source            TEXT NOT NULL DEFAULT 'community',
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  verified_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_food_thresholds (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_id      TEXT NOT NULL REFERENCES public.content_foods(id) ON DELETE CASCADE,
  serving_g    NUMERIC NOT NULL,
  fodmap_level TEXT NOT NULL CHECK (fodmap_level IN ('low','moderate','high')),
  note         TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Content: Recipes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_recipes (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  description        TEXT,
  meal_type          TEXT NOT NULL,
  prep_mins          SMALLINT NOT NULL DEFAULT 0,
  cook_mins          SMALLINT NOT NULL DEFAULT 0,
  default_servings   SMALLINT NOT NULL DEFAULT 2,
  difficulty         TEXT NOT NULL DEFAULT 'easy',
  calories           SMALLINT,
  protein_g          NUMERIC,
  carbs_g            NUMERIC,
  fat_g              NUMERIC,
  image_url          TEXT,
  is_premium         BOOLEAN NOT NULL DEFAULT false,
  phase_compatible   JSONB NOT NULL DEFAULT '["elimination","reintroduction","maintenance"]',
  dietitian_verified BOOLEAN NOT NULL DEFAULT false,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  verified_by        UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_recipe_ingredients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id   TEXT NOT NULL REFERENCES public.content_recipes(id) ON DELETE CASCADE,
  food_id     TEXT,
  food_name   TEXT NOT NULL,
  amount      NUMERIC NOT NULL,
  unit        TEXT NOT NULL,
  notes       TEXT,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  fodmap_level TEXT,
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.content_recipe_steps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id   TEXT NOT NULL REFERENCES public.content_recipes(id) ON DELETE CASCADE,
  step_number SMALLINT NOT NULL,
  instruction TEXT NOT NULL,
  image_url   TEXT
);

CREATE TABLE IF NOT EXISTS public.content_recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES public.content_recipes(id) ON DELETE CASCADE,
  tag       TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Content: Restaurant Guide
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_restaurant_cuisines (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  emoji             TEXT NOT NULL DEFAULT '🍽️',
  safe_dishes       JSONB NOT NULL DEFAULT '[]',
  risky_dishes      JSONB NOT NULL DEFAULT '[]',
  ordering_tips     JSONB NOT NULL DEFAULT '[]',
  avoid_ingredients JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  verified_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: authenticated read; dietitian/admin write
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'content_foods', 'content_food_thresholds',
    'content_recipes', 'content_recipe_ingredients',
    'content_recipe_steps', 'content_recipe_tags',
    'content_restaurant_cuisines'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Authenticated can read %s" ON public.%I FOR SELECT TO authenticated USING (true)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "Editors can write %s" ON public.%I FOR ALL TO authenticated USING (public.is_content_editor()) WITH CHECK (public.is_content_editor())',
      t, t
    );
  END LOOP;
END;
$$;

-- updated_at triggers
CREATE TRIGGER content_foods_updated_at
  BEFORE UPDATE ON public.content_foods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER content_recipes_updated_at
  BEFORE UPDATE ON public.content_recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER content_restaurant_cuisines_updated_at
  BEFORE UPDATE ON public.content_restaurant_cuisines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- To promote a user (run in SQL editor as service role):
--   UPDATE public.user_profiles SET role = 'admin' WHERE id = '<auth-user-uuid>';
