'use client';

import { useState } from 'react';
import { getSupabase } from '../../../lib/supabaseClient';

type Kind = 'food' | 'recipe' | 'restaurant';

const KIND_LABEL: Record<Kind, string> = {
  food: '🥦 Food entry',
  recipe: '🍳 Recipe',
  restaurant: '🍽️ Restaurant cuisine',
};

const PLACEHOLDER: Record<Kind, string> = {
  food: 'Paste your notes about a food, e.g.\n\n"Canned chickpeas, rinsed — small portions (about a quarter cup) are generally fine on low FODMAP because the GOS leaches into the brine. Larger portions are high in GOS…"',
  recipe: 'Paste a rough recipe (your own words), e.g.\n\n"Maple soy salmon bowls for 2. 300g salmon, 1 cup cooked rice, 1 tbsp maple syrup, 2 tsp tamari, spring onion green tops. Roast salmon 12 min at 200C, glaze with maple-tamari…"',
  restaurant: 'Paste notes about a cuisine, e.g.\n\n"Korean BBQ: plain grilled meats are usually safe if you skip the marinade. Bulgogi marinade has garlic + pear. Rice is safe. Kimchi contains garlic. Ask for unmarinated galbi…"',
};

export default function ImportAdmin() {
  const [kind, setKind] = useState<Kind>('recipe');
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<string>('');
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function parse() {
    setParsing(true);
    setError(null);
    setSaveMsg(null);
    setParsed('');
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setParsed(JSON.stringify(json.data, null, 2));
      setIsMock(!!json.mock);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setParsing(false);
    }
  }

  async function saveDraft() {
    setError(null);
    setSaveMsg(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase not configured');
      return;
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(parsed);
    } catch {
      setError('The edited JSON is not valid — fix it before saving.');
      return;
    }

    try {
      if (kind === 'food') {
        const id = slugId('f', String(data.name ?? 'unnamed'));
        const { error } = await supabase.from('content_foods').insert({
          id,
          name: data.name,
          category: data.category ?? 'other',
          default_serving_g: data.default_serving_g ?? 100,
          fodmap_level: data.fodmap_level ?? 'unknown',
          fructans: data.fructans ?? null,
          gos: data.gos ?? null,
          lactose: data.lactose ?? null,
          fructose: data.fructose ?? null,
          sorbitol: data.sorbitol ?? null,
          mannitol: data.mannitol ?? null,
          serving_note: data.serving_note ?? null,
          tags: data.tags ?? [],
          status: 'draft',
        });
        if (error) throw error;
        setSaveMsg(`Saved food draft "${data.name}" — review it under Foods.`);
      } else if (kind === 'recipe') {
        const id = slugId('r', String(data.title ?? 'unnamed'));
        const { error } = await supabase.from('content_recipes').insert({
          id,
          title: data.title,
          description: data.description ?? null,
          meal_type: data.meal_type ?? 'dinner',
          prep_mins: data.prep_mins ?? 0,
          cook_mins: data.cook_mins ?? 0,
          default_servings: data.default_servings ?? 2,
          difficulty: data.difficulty ?? 'easy',
          calories: data.calories ?? null,
          protein_g: data.protein_g ?? null,
          carbs_g: data.carbs_g ?? null,
          fat_g: data.fat_g ?? null,
          status: 'draft',
        });
        if (error) throw error;

        const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
        if (ingredients.length) {
          const { error: e2 } = await supabase.from('content_recipe_ingredients').insert(
            ingredients.map((ing: Record<string, unknown>, i: number) => ({
              recipe_id: id,
              food_name: ing.food_name,
              amount: ing.amount ?? 0,
              unit: ing.unit ?? '',
              notes: ing.notes ?? null,
              is_optional: ing.is_optional ?? false,
              fodmap_level: ing.fodmap_level ?? null,
              sort_order: i,
            }))
          );
          if (e2) throw e2;
        }

        const steps = Array.isArray(data.steps) ? data.steps : [];
        if (steps.length) {
          const { error: e3 } = await supabase.from('content_recipe_steps').insert(
            steps.map((s: unknown, i: number) => ({
              recipe_id: id,
              step_number: i + 1,
              instruction: String(s),
            }))
          );
          if (e3) throw e3;
        }

        const tags = Array.isArray(data.tags) ? data.tags : [];
        if (tags.length) {
          await supabase.from('content_recipe_tags').insert(
            tags.map((t: unknown) => ({ recipe_id: id, tag: String(t) }))
          );
        }
        setSaveMsg(`Saved recipe draft "${data.title}" — review it under Recipes.`);
      } else {
        const id = slugId('cu', String(data.name ?? 'unnamed'));
        const { error } = await supabase.from('content_restaurant_cuisines').insert({
          id,
          name: data.name,
          emoji: data.emoji ?? '🍽️',
          safe_dishes: data.safe_dishes ?? [],
          risky_dishes: data.risky_dishes ?? [],
          ordering_tips: data.ordering_tips ?? [],
          avoid_ingredients: data.avoid_ingredients ?? [],
          status: 'draft',
        });
        if (error) throw error;
        setSaveMsg(`Saved cuisine draft "${data.name}".`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">AI Import</h1>
      <p className="text-gray-500 text-sm mb-6">
        Paste raw text → AI structures it → you review &amp; save as a <b>draft</b>. Nothing is
        published until a dietitian approves it.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-900 mb-6">
        ⚠️ Original content only. Don&#39;t paste copyrighted recipe-blog text or proprietary tested
        FODMAP threshold tables (e.g. Monash data) — the AI rewrites in original phrasing, but the
        source must be yours to use.
      </div>

      <div className="flex gap-2 mb-4">
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => { setKind(k); setParsed(''); setSaveMsg(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium border ${
              kind === k
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER[kind]}
        rows={8}
        className="w-full border border-gray-300 rounded-xl p-4 text-sm bg-white mb-3"
      />

      <button
        onClick={parse}
        disabled={parsing || !text.trim()}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {parsing ? 'Parsing…' : '✨ Parse with AI'}
      </button>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {parsed && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Parsed result — review &amp; edit before saving</h2>
            {isMock && (
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                demo output (no AI key on server)
              </span>
            )}
          </div>
          <textarea
            value={parsed}
            onChange={(e) => setParsed(e.target.value)}
            rows={18}
            spellCheck={false}
            className="w-full border border-gray-300 rounded-xl p-4 text-xs font-mono bg-white mb-3"
          />
          <button
            onClick={saveDraft}
            className="bg-gray-900 hover:bg-gray-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            Save as draft
          </button>
          {saveMsg && <p className="text-sm text-emerald-700 mt-3">✓ {saveMsg}</p>}
        </div>
      )}
    </div>
  );
}

function slugId(prefix: string, name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  return `${prefix}_${slug}_${Date.now().toString(36).slice(-4)}`;
}
