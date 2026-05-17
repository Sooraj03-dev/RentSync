import { createClient } from '@/lib/supabase/server';
import { Building2, Wallet, Wrench, Bell, TrendingUp, Tag, CircuitBoard, Users, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  // Fetch properties (safe — only selects confirmed columns)
  const { data: properties = [], error: propErr } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const safeProperties = properties ?? [];

  // Fetch tenancies linked to this owner's properties (safe columns only)
  const { data: tenancies = [] } = await supabase
    .from('tenancies')
    .select('id, property_id, status, tenant_id, rent_amount, unit_number')
    .in(
      'property_id',
      safeProperties.length > 0 ? safeProperties.map((p: any) => p.id) : ['00000000-0000-0000-0000-000000000000']
    );

  const safeTenancies = tenancies ?? [];
  const activeTenancies = safeTenancies.filter((t: any) => t.status === 'active');

  // Fetch rent payments for this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const { data: payments = [] } = await supabase
    .from('rent_payments')
    .select('id, amount_paid, month_year, status, tenancy_id')
    .order('created_at', { ascending: false })
    .limit(50);

  const safePayments = payments ?? [];
  const rentThisMonth = safePayments
    .filter((p: any) => p.month_year === thisMonth && p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (p.amount_paid ?? 0), 0);

  // Fetch open maintenance tickets
  const { data: tickets = [] } = await supabase
    .from('maintenance_requests')
    .select('id, status, title, created_at')
    .eq('status', 'open')
    .limit(10);

  const safeTickets = tickets ?? [];
  const openTickets = safeTickets.length;

  // Fetch notices
  const { data: notices = [] } = await supabase
    .from('notices')
    .select('id')
    .eq('owner_id', user.id);

  const safeNotices = notices ?? [];

  // Computed stats
  const totalRentFromTenancies = activeTenancies.reduce((s: number, t: any) => s + (t.rent_amount ?? 0), 0);
  const avgRent = activeTenancies.length > 0
    ? Math.round(totalRentFromTenancies / activeTenancies.length)
    : safeProperties.length > 0
      ? Math.round(safeProperties.reduce((s: number, p: any) => s + (p.rent_price ?? 0), 0) / safeProperties.length)
      : 0;

  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  // Risk heuristic based on open tickets
  const riskLevel = openTickets === 0 ? 'Low' : openTickets < 3 ? 'Medium' : 'High';
  const riskColor = openTickets === 0 ? 'text-emerald-600' : openTickets < 3 ? 'text-amber-500' : 'text-red-500';
  const suggestedBudget = openTickets === 0 ? 500 : openTickets * 1200;

  return (
    <div className="p-8 space-y-7">

      {/* Schema warning if propErr */}
      {propErr && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Database query issue</p>
            <p className="text-xs mt-0.5 text-amber-700">{propErr.message}</p>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}!</h1>
          <p className="text-slate-500 mt-1 text-sm max-w-xl">
            Here's a live snapshot of your rental portfolio — rent, maintenance, and tenants, all in one place.
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shrink-0 shadow-sm shadow-blue-200"
        >
          Add Property
        </Link>
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Properties',     value: safeProperties.length,            icon: Building2, color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100',    href: '/dashboard/properties' },
          { label: 'Rent Collected', value: formatCurrency(rentThisMonth),    icon: Wallet,    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', href: '/dashboard/rent' },
          { label: 'Open Tickets',   value: openTickets,                      icon: Wrench,    color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-100',     href: '/dashboard/maintenance' },
          { label: 'Notices Sent',   value: safeNotices.length,               icon: Bell,      color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   href: '/dashboard/notices' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <Link key={m.label} href={m.href} className={`bg-white border ${m.border} rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{m.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{m.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Intelligence Cards */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Smart Rent Suggestions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Tag className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Rent Overview</h2>
          </div>

          <p className="text-sm text-slate-500 mb-5 leading-relaxed">
            A live summary of your rental income and pricing across all properties.
          </p>

          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Active Tenancies</span>
              <span className="text-sm font-bold text-blue-600">{activeTenancies.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Avg. Rent / Unit</span>
              <span className="text-sm font-bold text-slate-700">{avgRent > 0 ? `${formatCurrency(avgRent)}/mo` : '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">This Month Collected</span>
              <span className="text-sm font-bold text-emerald-600">{formatCurrency(rentThisMonth)}</span>
            </div>
          </div>

          {avgRent > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-800">Potential Increase</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  A 5-8% increase ({formatCurrency(Math.round(avgRent * 1.06))}/mo) would still be competitive based on current market trends.
                </p>
              </div>
            </div>
          )}

          <Link
            href="/dashboard/rent"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors mt-auto"
          >
            View Rent Dashboard
          </Link>
        </div>

        {/* Maintenance Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <CircuitBoard className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Maintenance Status</h2>
          </div>

          <p className="text-sm text-slate-500 mb-5 leading-relaxed">
            Real-time status of maintenance tickets across your properties.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Open Tickets</p>
              <p className={`text-lg font-bold ${openTickets === 0 ? 'text-emerald-600' : 'text-red-500'}`}>{openTickets}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Risk Level</p>
              <p className={`text-lg font-bold ${riskColor}`}>{riskLevel}</p>
            </div>
          </div>

          {safeTickets.length > 0 ? (
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Open Issues</p>
              <div className="space-y-2">
                {safeTickets.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <p className="text-xs text-slate-600 truncate">{t.title}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-5 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-emerald-700">✓ No open maintenance tickets. All clear!</p>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Suggested Maintenance Budget</span>
            <span className="text-sm font-bold text-slate-800">{formatCurrency(suggestedBudget)}/qtr</span>
          </div>

          <Link
            href="/dashboard/maintenance"
            className="w-full border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 text-sm font-semibold py-2.5 rounded-xl text-center transition-colors mt-auto"
          >
            View All Tickets
          </Link>
        </div>
      </div>

      {/* Tenant Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Tenant Overview</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Total Units',     value: safeProperties.reduce((s: number, p: any) => s + (p.total_units ?? 1), 0), color: 'text-blue-600' },
            { label: 'Active Tenants',  value: activeTenancies.length, color: 'text-emerald-600' },
            { label: 'Vacant Units',    value: Math.max(0, safeProperties.reduce((s: number, p: any) => s + (p.total_units ?? 1), 0) - activeTenancies.length), color: 'text-amber-500' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Properties Quick List */}
      {safeProperties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Your Properties</h2>
            <Link href="/dashboard/properties" className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {safeProperties.slice(0, 6).map((p: any) => {
              const propTenancies = activeTenancies.filter((t: any) => t.property_id === p.id);
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/properties/${p.id}`}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 flex items-start gap-3 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-sm truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{p.address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold text-slate-500">{p.total_units ?? 1} units</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] font-bold text-emerald-600">{propTenancies.length} occupied</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No properties CTA */}
      {safeProperties.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Add your first property</p>
            <p className="text-sm text-slate-500 mt-1">Start managing rent, maintenance and more.</p>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Add Property
          </Link>
        </div>
      )}
    </div>
  );
}
