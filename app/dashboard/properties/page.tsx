import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { Building2, Users, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Properties' };

export default async function PropertiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: properties } = await supabase
    .from('properties')
    .select('*, tenancies(id, unit_number, rent_amount, status, tenant_id)')
    .eq('landlord_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your rental portfolio.</p>
        </div>
        <Link
          href="/onboard"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Property
        </Link>
      </div>

      {(!properties || properties.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Building2 className="w-12 h-12 mb-3 text-slate-700" />
          <p className="font-medium">No properties yet</p>
          <p className="text-sm mt-1">Add your first property to get started.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(properties ?? []).map(p => {
          type Tenancy = { id: string; unit_number: string; rent_amount: number; status: string; tenant_id: string | null };
          const activeTenancies = (p.tenancies as Tenancy[] | null)?.filter((t) => t.status === 'active') ?? [];
          const totalRent = activeTenancies.reduce((s: number, t: Tenancy) => s + (t.rent_amount ?? 0), 0);
          return (
            <Link
              key={p.id}
              href={`/dashboard/properties/${p.id}`}
              className="bg-white border border-slate-200 hover:border-blue-600/50 rounded-xl p-5 flex flex-col gap-4 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-blue-300 transition-colors">{p.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{p.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-slate-200/50 pt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Units</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{p.total_units}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Occupied</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{activeTenancies.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Monthly</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{formatCurrency(totalRent)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
