'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../../../lib/supabaseClient';

export interface FoodRow {
  id: string;
  name: string;
  category: string;
  default_serving_g: number;
  fodmap_level: string;
  fructans: string | null;
  gos: string | null;
  lactose: string | null;
  fructose: string | null;
  sorbitol: string | null;
  mannitol: string | null;
  serving_note: string | null;
  status: string;
}

const LEVELS = ['low', 'moderate', 'high', 'unknown'];
const CATEGORIES = [
  'fruit', 'vegetable', 'grain', 'protein', 'dairy', 'dairy-alternative', 'legume',
  'nut-seed', 'condiment', 'beverage', 'sweetener', 'herb-spice', 'snack', 'other',
];
const CATEGORY_PREFIX: Record<string, string> = {
  fruit: 'f', vegetable: 'v', grain: 'g', protein: 'p', dairy: 'd',
  'dairy-alternative': 'da', legume: 'l', 'nut-seed': 'ns', condiment: 'c',
  beverage: 'bv', sweetener: 'sw', 'herb-spice': 'hs', snack: 'sn', other: 'o',
};

export function levelColor(level: string | null) {
  switch (level) {
    case 'low': return 'bg-emerald-100 text-emerald-800';
    case 'moderate': return 'bg-amber-100 text-amber-800';
    case 'high': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-500';
  }
}

const EMPTY: FoodRow = {
  id: '', name: '', category: 'other', default_serving_g: 100, fodmap_level: 'unknown',
  fructans: null, gos: null, lactose: null, fructose: null, sorbitol: null, mannitol: null,
  serving_note: null, status: 'draft',
};

export default function FoodsAdmin() {
  const [rows, setRows] = useState<FoodRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved'>('all');
  const [editing, setEditing] = useState<FoodRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    let q = supabase.from('content_foods').select('*').order('name').limit(200);
    if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data as FoodRow[]) ?? []);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function save(food: FoodRow) {
    const supabase = getSupabase();
    if (!supabase) return;
    const row = { ...food };
    if (isNew && !row.id) {
      const prefix = CATEGORY_PREFIX[row.category] ?? 'o';
      row.id = `${prefix}_${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
    }
    const { error } = await supabase.from('content_foods').upsert(row);
    if (error) {
      setError(error.message);
    } else {
      setEditing(null);
      setIsNew(false);
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this food entry?')) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from('content_foods').delete().eq('id', id);
    if (error) setError(error.message);
    else {
      setEditing(null);
      load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Foods</h1>
          <p className="text-gray-500 text-sm">Review and correct FODMAP ratings.</p>
        </div>
        <button
          onClick={() => { setEditing({ ...EMPTY }); setIsNew(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          + Add food
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search foods…"
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
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Serving</th>
              <th className="px-4 py-3 font-medium">FODMAP</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{r.category}</td>
                <td className="px-4 py-2.5 text-gray-500">{r.default_serving_g} g</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColor(r.fodmap_level)}`}>
                    {r.fodmap_level}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => { setEditing({ ...r }); setIsNew(false); }}
                    className="text-emerald-700 hover:underline text-sm"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No foods yet — add one or use AI Import.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <FoodEditor
          food={editing}
          isNew={isNew}
          onChange={setEditing}
          onSave={() => save(editing)}
          onDelete={isNew ? undefined : () => remove(editing.id)}
          onClose={() => { setEditing(null); setIsNew(false); }}
        />
      )}
    </div>
  );
}

function FoodEditor({
  food, isNew, onChange, onSave, onDelete, onClose,
}: {
  food: FoodRow;
  isNew: boolean;
  onChange: (f: FoodRow) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<FoodRow>) => onChange({ ...food, ...patch });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-lg mb-4">{isNew ? 'Add food' : `Edit: ${food.name}`}</h2>

        <Field label="Name">
          <input value={food.name} onChange={(e) => set({ name: e.target.value })} className="inp" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={food.category} onChange={(e) => set({ category: e.target.value })} className="inp">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Default serving (g)">
            <input
              type="number"
              value={food.default_serving_g}
              onChange={(e) => set({ default_serving_g: Number(e.target.value) })}
              className="inp"
            />
          </Field>
        </div>
        <Field label="Overall FODMAP level (at default serving)">
          <select value={food.fodmap_level} onChange={(e) => set({ fodmap_level: e.target.value })} className="inp">
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>

        <p className="text-sm font-medium mt-4 mb-2">Subgroups</p>
        <div className="grid grid-cols-3 gap-3">
          {(['fructans', 'gos', 'lactose', 'fructose', 'sorbitol', 'mannitol'] as const).map((k) => (
            <Field key={k} label={k}>
              <select
                value={food[k] ?? ''}
                onChange={(e) => set({ [k]: e.target.value || null } as Partial<FoodRow>)}
                className="inp"
              >
                <option value="">—</option>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          ))}
        </div>

        <Field label="Serving note">
          <input
            value={food.serving_note ?? ''}
            onChange={(e) => set({ serving_note: e.target.value || null })}
            placeholder='e.g. "Low at 30g, moderate above 75g"'
            className="inp"
          />
        </Field>

        <Field label="Review status">
          <select value={food.status} onChange={(e) => set({ status: e.target.value })} className="inp">
            <option value="draft">draft — needs review</option>
            <option value="approved">approved — dietitian verified</option>
          </select>
        </Field>

        <div className="flex items-center justify-between mt-6">
          {onDelete ? (
            <button onClick={onDelete} className="text-red-600 text-sm hover:underline">Delete</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300">Cancel</button>
            <button onClick={onSave} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
