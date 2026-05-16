import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Wallet, Wrench, Bell, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TenantPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tenancy } = await supabase
    .from('tenancies')
    .select('*, properties(name, address)')
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  let thisMonthPayment = null;
  let openTickets = 0;
  let pinnedNotice = null;

  if (tenancy) {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [payRes, ticketRes, noticeRes] = await Promise.all([
      supabase.from('rent_payments').select('*').eq('tenancy_id', tenancy.id).eq('month_year', monthYear).maybeSingle(),
      supabase.from('maintenance_requests').select('id', { count: 'exact' }).eq('tenancy_id', tenancy.id).in('status', ['open', 'in_progress']),
      supabase.from('notices').select('*').eq('property_id', tenancy.property_id).eq('pinned', true).order('created_at', { ascending: false }).limit(1),
    ]);

    thisMonthPayment = payRes.data;
    openTickets = ticketRes.count ?? 0;
    pinnedNotice = noticeRes.data?.[0] ?? null;
  }

  const rentStatus = !thisMonthPayment ? 'due' : thisMonthPayment.status;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {profile?.name?.split(' ')[0] ?? 'Tenant'} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {tenancy ? `${tenancy.unit_number} · ${(tenancy.properties as any)?.name}` : 'No active tenancy'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Rent card */}
        <Link href="/tenant/rent" className="bg-white border border-slate-200 hover:border-blue-600/50 rounded-xl p-5 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">This Month's Rent</p>
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          {tenancy && (
            <p className="text-2xl font-bold text-slate-900">{formatCurrency((tenancy as any).rent_amount)}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            {rentStatus === 'paid' ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm text-emerald-400 font-semibold">Paid</span></>
            ) : rentStatus === 'late' ? (
              <><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-sm text-red-400 font-semibold">Overdue</span></>
            ) : (
              <><Clock className="w-4 h-4 text-yellow-400" /><span className="text-sm text-yellow-400 font-semibold">Due — Pay Now →</span></>
            )}
          </div>
        </Link>

        {/* Maintenance card */}
        <Link href="/tenant/maintenance" className="bg-white border border-slate-200 hover:border-blue-600/50 rounded-xl p-5 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Open Tickets</p>
            <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{openTickets}</p>
          <p className="text-sm text-slate-500 mt-2">{openTickets === 0 ? 'All clear ✓' : 'Needs attention'}</p>
        </Link>

        {/* Notice card */}
        <Link href="/tenant/notices" className="bg-white border border-slate-200 hover:border-blue-600/50 rounded-xl p-5 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pinned Notice</p>
            <div className="w-8 h-8 rounded-lg bg-yellow-900/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
          {pinnedNotice ? (
            <>
              <p className="font-semibold text-slate-800 text-sm line-clamp-1">{pinnedNotice.title}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pinnedNotice.body}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No pinned notices</p>
          )}
        </Link>
      </div>
    </div>
  );
}
