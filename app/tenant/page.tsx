import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Wallet, Wrench, Bell, CheckCircle2, AlertCircle, Clock, Key, ArrowRight, MessageSquare, FileText, CreditCard } from 'lucide-react';
import { TenantEmptyState } from '@/components/tenant/TenantEmptyState';

export const dynamic = 'force-dynamic';

export default async function TenantPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, tenancyRes] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).single(),
    supabase.from('tenancies').select('*, properties(name, address, owner_id)').eq('tenant_id', user.id).eq('status', 'active').maybeSingle(),
  ]);

  const profile = profileRes.data;
  const tenancy = tenancyRes.data;
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  let thisMonthPayment: any = null;
  let openTickets = 0;
  let pinnedNotice: any = null;
  let totalUnread = 0;

  if (tenancy) {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [payRes, ticketRes, noticeRes, convRes] = await Promise.all([
      supabase.from('rent_payments').select('*').eq('tenancy_id', tenancy.id).eq('month_year', monthYear).maybeSingle(),
      supabase.from('maintenance_requests').select('id', { count: 'exact' }).eq('tenancy_id', tenancy.id).in('status', ['open', 'in_progress']),
      supabase.from('notices').select('*').eq('property_id', tenancy.property_id).order('created_at', { ascending: false }).limit(1),
      supabase.from('conversations').select('tenant_unread').eq('tenant_id', user.id),
    ]);

    thisMonthPayment = payRes.data;
    openTickets = ticketRes.count ?? 0;
    pinnedNotice = noticeRes.data?.[0] ?? null;
    totalUnread = (convRes.data ?? []).reduce((s: number, c: any) => s + (c.tenant_unread ?? 0), 0);
  }

  const rentAmount = (tenancy as any)?.rent_amount ?? 0;
  const dueDay = (tenancy as any)?.due_day ?? 1;
  const rentStatus = !thisMonthPayment ? 'due' : thisMonthPayment.status;

  const now = new Date();
  const daysUntilDue = (() => {
    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })();

  if (!tenancy) {
    return <TenantEmptyState />;
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-500 cursor-pointer hover:text-slate-700" />
            {pinnedNotice && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Rent due banner */}
        {rentStatus !== 'paid' && (
          <div className="bg-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-400/30">
                  ! Upcoming Payment
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {rentStatus === 'late' ? 'Rent is overdue!' : `Rent is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Your total due for this month is {formatCurrency(rentAmount)}
              </p>
            </div>
            <Link href="/tenant/rent"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shrink-0">
              Pay Now
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400">Last paid: {thisMonthPayment?.payment_date ? new Date(thisMonthPayment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Current Balance</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{formatCurrency(rentAmount)}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              {openTickets > 0 && (
                <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">In Progress</span>
              )}
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center ml-auto">
                <Wrench className="w-4 h-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Active Requests</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{openTickets} Request{openTickets !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400">Next due</p>
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Notices</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 line-clamp-1">{pinnedNotice?.title ?? 'No new notices'}</p>
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Building updates */}
          <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Building Updates</h3>
              <Link href="/tenant/notices" className="text-blue-600 text-sm font-semibold hover:underline">View All</Link>
            </div>
            {pinnedNotice ? (
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-slate-800">{pinnedNotice.title}</p>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">
                      {new Date(pinnedNotice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{pinnedNotice.body}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No building updates</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-3">
            <Link href="/tenant/messages"
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                {totalUnread > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800">Messages</p>
              <p className="text-xs text-slate-400">Chat with landlord</p>
            </Link>

            <Link href="/tenant/maintenance"
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
                <Wrench className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-sm font-bold text-slate-800">New Request</p>
              <p className="text-xs text-slate-400">Report maintenance</p>
            </Link>

            <Link href="/tenant/documents"
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mb-2">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">Documents</p>
              <p className="text-xs text-slate-400">Lease & files</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
