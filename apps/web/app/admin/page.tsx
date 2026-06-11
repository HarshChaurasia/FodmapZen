'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '../../lib/supabaseClient';

interface Counts {
  foods: number;
  foodsDraft: number;
  recipes: number;
  recipesDraft: number;
  cuisines: number;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    async function load() {
      const count = async (table: string, draftOnly = false) => {
        let q = supabase!.from(table).select('*', { count: 'exact', head: true });
        if (draftOnly) q = q.eq('status', 'draft');
        const { count: c, error } = await q;
        if (error) throw error;
        return c ?? 0;
      };
      try {
        const [foods, foodsDraft, recipes, recipesDraft, cuisines] = await Promise.all([
          count('content_foods'),
          count('content_foods', true),
          count('content_recipes'),
          count('content_recipes', true),
          count('content_restaurant_cuisines'),
        ]);
        setCounts({ foods, foodsDraft, recipes, recipesDraft, cuisines });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Content dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">
        Master content lives here in Supabase; the mobile app ships an approved snapshot as bundled
        seed data.
      </p>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-sm text-amber-900">
          <p className="font-semibold mb-1">Content tables not reachable</p>
          <p className="mb-2">{error}</p>
          <p>
            Apply <code>supabase/migrations/002_roles_and_content.sql</code> with{' '}
            <code>supabase db push</code> to create them.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Foods" value={counts?.foods} sub={`${counts?.foodsDraft ?? '–'} pending review`} href="/admin/foods" />
        <StatCard label="Recipes" value={counts?.recipes} sub={`${counts?.recipesDraft ?? '–'} pending review`} href="/admin/recipes" />
        <StatCard label="Restaurant cuisines" value={counts?.cuisines} sub="guide entries" href="/admin/import" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold mb-3">Workflow</h2>
        <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-2">
          <li>
            <Link href="/admin/import" className="text-emerald-700 underline">AI Import</Link>:
            paste raw food/recipe/restaurant text → AI structures it → saved as <b>draft</b>.
          </li>
          <li>
            Review &amp; correct drafts in <Link href="/admin/foods" className="text-emerald-700 underline">Foods</Link> /{' '}
            <Link href="/admin/recipes" className="text-emerald-700 underline">Recipes</Link>, then mark <b>approved</b>.
          </li>
          <li>
            Approved content is exported into the mobile seed files at release time
            (bump <code>SEED_VERSION</code>).
          </li>
        </ol>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, href }: { label: string; value?: number; sub: string; href: string }) {
  return (
    <Link href={href} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-emerald-300 transition-colors">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '–'}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </Link>
  );
}
