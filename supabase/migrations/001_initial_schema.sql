-- FodmapZen — Supabase (PostgreSQL) Remote Schema
-- Run via: supabase db push
-- Row-Level Security is enabled on all user tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- Users (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phase                TEXT NOT NULL DEFAULT 'unknown',
  phase_start_date     DATE,
  household_size       SMALLINT NOT NULL DEFAULT 2,
  preferred_cook_time  TEXT NOT NULL DEFAULT 'any',
  dietary_restrictions JSONB NOT NULL DEFAULT '[]',
  subscription_tier    TEXT NOT NULL DEFAULT 'free',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Meal Plans
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own meal plans"
  ON public.meal_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meal plan slots
CREATE TABLE IF NOT EXISTS public.meal_plan_slots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_of_week  TEXT NOT NULL,
  meal_type    TEXT NOT NULL,
  recipe_id    TEXT NOT NULL,  -- references local SQLite recipe id
  servings     SMALLINT NOT NULL DEFAULT 2
);

ALTER TABLE public.meal_plan_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own meal plan slots"
  ON public.meal_plan_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Food Logs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.food_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  recipe_id    TEXT,
  custom_food  TEXT,
  notes        TEXT,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own food logs"
  ON public.food_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_food_logs_user_date ON public.food_logs(user_id, date);

-- ─────────────────────────────────────────────────────────────────────────────
-- Symptom Logs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  bloating      SMALLINT NOT NULL DEFAULT 0,
  gas           SMALLINT NOT NULL DEFAULT 0,
  pain          SMALLINT NOT NULL DEFAULT 0,
  stool_type    SMALLINT,
  stress_level  SMALLINT NOT NULL DEFAULT 0,
  sleep_quality SMALLINT NOT NULL DEFAULT 0,
  notes         TEXT,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own symptom logs"
  ON public.symptom_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_symptom_logs_user_date ON public.symptom_logs(user_id, date);

-- ─────────────────────────────────────────────────────────────────────────────
-- Reintroduction Tests
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reintroduction_tests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fodmap_group   TEXT NOT NULL,
  food_tested    TEXT NOT NULL,
  start_date     DATE NOT NULL,
  day1_reaction  SMALLINT,
  day2_reaction  SMALLINT,
  day3_reaction  SMALLINT,
  final_verdict  TEXT NOT NULL DEFAULT 'pending',
  notes          TEXT,
  completed_at   TIMESTAMPTZ
);

ALTER TABLE public.reintroduction_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reintroduction tests"
  ON public.reintroduction_tests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Recipe Favorites
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipe_favorites (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  saved_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own favorites"
  ON public.recipe_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Updated_at trigger helper
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
