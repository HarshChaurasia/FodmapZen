'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../../../lib/supabaseClient';

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  meal_type: string;
  prep_mins: number;
  cook_mins: number;
  default_servings: number;
  difficulty: string;
  calories: number | null;
  is_premium: boolean;
  dietitian_verified: boolean;
  status: string;
}

interface IngredientRow {
  id?: string;
  recipe_id: string;
  food_name: string;
  amount: number;
  unit: string;
  notes: string | null;
  sort_order: number;
}

interface StepRow {
  id?: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
}

export default function RecipesAdmin() {
  const [rows, setRows] = useState<RecipeRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved'>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<RecipeRow | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    let q = supabase.from('content_recipes').select('*').order('title').limit(200);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search.trim()) q = q.ilike('title', `%${search.trim()}%`);
    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data as RecipeRow[]) ?? []);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function setStatus(recipe: RecipeRow, status: string) {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase
      .from('content_recipes')
      .update({ status, dietitian_verified: status === 'approved' })
      .eq('id', recipe.id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <p className="text-gray-500 text-sm">
          Review queue — approving marks the recipe dietitian-verified.
        </p>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft (needs review)</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium">{r.title}</td>
                <td className="px-4 py-2.5 text-gray-500">{r.meal_type}</td>
                <td className="px-4 py-2.5 text-gray-500">{r.prep_mins + r.cook_mins} min</td>
                <td className="px-4 py-2.5 text-gray-500">{r.is_premium ? 'Premium' : 'Free'}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <button onClick={() => setOpen(r)} className="text-emerald-700 hover:underline text-sm mr-3">
                    View
                  </button>
                  {r.status === 'draft' ? (
                    <button onClick={() => setStatus(r, 'approved')} className="text-emerald-700 hover:underline text-sm font-medium">
                      Approve ✓
                    </button>
                  ) : (
                    <button onClick={() => setStatus(r, 'draft')} className="text-amber-700 hover:underline text-sm">
                      Back to draft
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No recipes yet — use AI Import to add drafts.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <RecipeDetail recipe={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function RecipeDetail({ recipe, onClose }: { recipe: RecipeRow; onClose: () => void }) {
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase
      .from('content_recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipe.id)
      .order('sort_order')
      .then(({ data }) => setIngredients((data as IngredientRow[]) ?? []));
    supabase
      .from('content_recipe_steps')
      .select('*')
      .eq('recipe_id', recipe.id)
      .order('step_number')
      .then(({ data }) => setSteps((data as StepRow[]) ?? []));
  }, [recipe.id]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg">{recipe.title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {recipe.meal_type} · {recipe.prep_mins + recipe.cook_mins} min · {recipe.difficulty} ·{' '}
          {recipe.default_servings} servings{recipe.calories ? ` · ${recipe.calories} kcal` : ''}
        </p>
        {recipe.description && <p className="text-sm text-gray-700 mb-4">{recipe.description}</p>}

        <h3 className="font-semibold text-sm mb-2">Ingredients</h3>
        <ul className="list-disc ml-5 text-sm text-gray-700 mb-4">
          {ingredients.map((i, idx) => (
            <li key={i.id ?? idx}>
              {i.amount} {i.unit} {i.food_name}
              {i.notes ? <span className="text-gray-400"> — {i.notes}</span> : null}
            </li>
          ))}
          {ingredients.length === 0 && <li className="text-gray-400">none recorded</li>}
        </ul>

        <h3 className="font-semibold text-sm mb-2">Steps</h3>
        <ol className="list-decimal ml-5 text-sm text-gray-700 mb-6">
          {steps.map((s, idx) => <li key={s.id ?? idx} className="mb-1">{s.instruction}</li>)}
          {steps.length === 0 && <li className="text-gray-400">none recorded</li>}
        </ol>

        <div className="text-right">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}
