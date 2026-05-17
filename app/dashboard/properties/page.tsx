import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { Building2, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Properties' };

export default async function PropertiesPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="p-8 text-red-500 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Not authenticated. Please log in again.
      </div>
    );
  }

  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Debug: check if there's a query error
  if (propError) {
    return (
      <div className="p-8 space-y-2">
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <AlertCircle className="w-5 h-5" /> Database error
        </div>
        <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 whitespace-pre-wrap">
          {JSON.stringify(propError, null, 2)}
        </pre>
        <p className="text-xs text-slate-500">Your user ID: <code className="bg-slate-100 px-1 py-0.5 rounded">{user.id}</code></p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your rental portfolio.</p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Property
        </Link>
      </div>

      {(!properties || properties.length === 0) && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Building2 className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-medium">No properties found</p>
            <p className="text-sm mt-1 text-center max-w-xs">
              No properties are linked to your account (<code className="bg-slate-100 px-1 rounded text-[11px]">{user.id}</code>).
            </p>
            <p className="text-xs text-slate-400 mt-3 text-center max-w-sm">
              If you added properties directly in Supabase, make sure the <strong>owner_id</strong> column matches the ID above.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(properties ?? []).map(p => {
          const units = (p as any).total_units ?? (p as any).unit_count ?? 1;
          const rentPrice = (p as any).rent_price ?? 0;
          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200 hover:border-blue-600/50 rounded-xl p-5 flex flex-col gap-4 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <Link
                    href={`/dashboard/properties/${p.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                  >
                    {p.name}
                  </Link>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p as any).address ?? '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-500 hover:text-blue-600 mt-0.5 block"
                  >
                    {(p as any).address}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-slate-200/50 pt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Units</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{units}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Type</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5 capitalize">{(p as any).property_type ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Rent</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{rentPrice > 0 ? formatCurrency(rentPrice) : '—'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
