import { createClient } from '@/lib/supabase/server';
import { RentGrid } from '@/components/rent/RentGrid';
import { Building2, Wallet, Wrench, Bell, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch all landlord data in parallel
  const [propsRes, paymentsRes, ticketsRes, noticesRes] = await Promise.all([
    supabase.from('properties').select('id, name, address, total_units').eq('landlord_id', user.id),
    supabase.from('rent_payments').select(`
      id, tenancy_id, amount_paid, payment_date, month_year, status,
      tenancies!inner(unit_number, property_id, profiles(name), properties!inner(landlord_id))
    `).eq('tenancies.properties.landlord_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('maintenance_requests').select(`
      id, tenancies!inner(property_id, properties!inner(landlord_id))
    `).eq('tenancies.properties.landlord_id', user.id).eq('status', 'open'),
    supabase.from('notices').select('id').eq('landlord_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);

  const properties = propsRes.data ?? [];
  const payments   = ((paymentsRes.data ?? []) as unknown) as Parameters<typeof RentGrid>[0]['rows'];
  const openTickets = ticketsRes.data?.length ?? 0;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const rentThisMonth = payments
    .filter(p => p.month_year === thisMonth && p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);

  const metrics = [
    { label: 'Properties',    value: properties.length,         icon: Building2,  color: 'text-blue-400',    bg: 'bg-blue-900/30' },
    { label: 'Rent Collected', value: formatCurrency(rentThisMonth), icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
    { label: 'Open Tickets',  value: openTickets,               icon: Wrench,     color: 'text-red-400',     bg: 'bg-red-900/30' },
    { label: 'Notices Sent',  value: noticesRes.data?.length ?? 0, icon: Bell,    color: 'text-yellow-400',  bg: 'bg-yellow-900/30' },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Overview</h1>
        <p className="text-slate-500 mt-1 text-sm">Real-time performance of your rental ecosystem.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{m.label}</p>
                <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Properties quick list */}
      {properties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Your Properties</h2>
            <Link href="/dashboard/properties" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">View all →</Link>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {properties.slice(0, 4).map(p => (
              <Link
                key={p.id}
                href={`/dashboard/properties/${p.id}`}
                className="bg-white border border-slate-200 hover:border-blue-600/50 rounded-xl p-4 flex items-start gap-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-blue-300 transition-colors">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.address}</p>
                  <p className="text-xs text-slate-600 mt-1">{p.total_units} units</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Rent grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">Recent Rent Payments</h2>
          <Link href="/dashboard/rent" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">View all →</Link>
        </div>
        <RentGrid rows={payments.slice(0, 8)} />
      </div>
    </div>
  );
}
