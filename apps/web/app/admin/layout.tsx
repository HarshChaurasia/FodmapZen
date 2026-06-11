'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabaseClient';

type Role = 'user' | 'dietitian' | 'admin';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/foods', label: 'Foods', icon: '🥦' },
  { href: '/admin/recipes', label: 'Recipes', icon: '🍳' },
  { href: '/admin/import', label: 'AI Import', icon: '✨' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabase();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) {
        setRoleError(error.message);
        setRole(null);
      } else {
        setRoleError(null);
        setRole(((data?.role as Role) ?? 'user'));
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadRole(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setRole(null);
      if (s) loadRole(s.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, loadRole]);

  if (!supabase) {
    return (
      <Shell>
        <Notice title="Supabase not configured">
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>apps/web/.env.local</code>, then
          restart the dev server.
        </Notice>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <p className="text-gray-500">Loading…</p>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <LoginForm />
      </Shell>
    );
  }

  if (roleError) {
    return (
      <Shell>
        <Notice title="Could not check your role">
          <p className="mb-2">{roleError}</p>
          <p>
            If this mentions a missing <code>role</code> column or table, apply migration{' '}
            <code>supabase/migrations/002_roles_and_content.sql</code> (<code>supabase db push</code>).
          </p>
          <SignOutButton />
        </Notice>
      </Shell>
    );
  }

  if (role !== 'admin' && role !== 'dietitian') {
    return (
      <Shell>
        <Notice title="No access">
          <p className="mb-2">
            Signed in as <strong>{session.user.email}</strong>, but this account is not an admin or
            dietitian.
          </p>
          <p className="mb-4 text-sm text-gray-500">
            Promote it in the Supabase SQL editor:{' '}
            <code>
              UPDATE user_profiles SET role = &#39;admin&#39; WHERE id = &#39;{session.user.id}&#39;;
            </code>
          </p>
          <SignOutButton />
        </Notice>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="font-bold text-emerald-700 text-lg">FodmapZen</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {role === 'admin' ? 'Admin console' : 'Dietitian console'}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === item.href
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate mb-2">{session.user.email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h1 className="font-bold text-lg mb-3">{title}</h1>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}

function SignOutButton() {
  return (
    <button
      onClick={() => getSupabase()?.auth.signOut()}
      className="text-sm text-gray-500 hover:text-gray-800 underline"
    >
      Sign out
    </button>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h1 className="font-bold text-lg mb-1">Staff sign in</h1>
      <p className="text-sm text-gray-500 mb-5">Admins & dietitians only.</p>
      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-sm"
      />
      <label className="block text-sm font-medium mb-1">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-sm"
      />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-50"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
