'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, currentMonthYear } from '@/lib/utils';
import { Wallet, CreditCard, Smartphone, Building, CheckCircle2, Shield, Loader2, ChevronRight } from 'lucide-react';

type PayMethod = 'upi' | 'netbanking' | 'card' | 'wallet';
type UPIApp = 'gpay' | 'phonepe' | 'paytm' | 'other';

const UPI_APPS = [
  { id: 'gpay',    label: 'Google Pay',  color: '#4285F4', abbr: 'G' },
  { id: 'phonepe', label: 'PhonePe',     color: '#5f259f', abbr: 'P' },
  { id: 'paytm',   label: 'Paytm',       color: '#00BAF2', abbr: 'Pa' },
  { id: 'other',   label: 'Other UPI',   color: '#6B7280', abbr: '⊕' },
] as const;

export default function TenantRentPage() {
  const [tenancy, setTenancy] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payMethod, setPayMethod] = useState<PayMethod>('upi');
  const [upiApp, setUpiApp] = useState<UPIApp>('gpay');
  const [upiId, setUpiId] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: t } = await supabase
        .from('tenancies')
        .select('*, properties(name, address)')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      setTenancy(t);
      if (t) {
        const { data: p } = await supabase
          .from('rent_payments')
          .select('*')
          .eq('tenancy_id', t.id)
          .order('created_at', { ascending: false });
        setPayments(p ?? []);
        const thisMonth = currentMonthYear();
        if (p?.some(x => x.month_year === thisMonth && x.status === 'paid')) setPaid(true);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handlePay = async () => {
    if (!tenancy || paid) return;
    setPaying(true);
    const { data: { user } } = await supabase.auth.getUser();
    const thisMonth = currentMonthYear();
    const { error } = await supabase.from('rent_payments').insert({
      tenancy_id: tenancy.id,
      amount_paid: tenancy.rent_amount,
      payment_date: new Date().toISOString().slice(0, 10),
      month_year: thisMonth,
      status: 'paid',
    });
    if (!error) {
      setPaid(true);
      const { data: p } = await supabase.from('rent_payments').select('*').eq('tenancy_id', tenancy.id).order('created_at', { ascending: false });
      setPayments(p ?? []);
    }
    setPaying(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-20 text-slate-500">
        <Wallet className="w-12 h-12 mb-3 text-slate-700" />
        <p>No active tenancy found.</p>
      </div>
    );
  }

  const maintenanceFee = Math.round(tenancy.rent_amount * 0.02);
  const convenienceFee = 99;
  const total = tenancy.rent_amount + maintenanceFee + convenienceFee;

  const METHOD_TABS: { id: PayMethod; label: string; icon: typeof Wallet; badge?: string }[] = [
    { id: 'upi',        label: 'UPI',         icon: Smartphone, badge: 'FASTEST' },
    { id: 'netbanking', label: 'Net Banking',  icon: Building },
    { id: 'card',       label: 'Card',         icon: CreditCard },
    { id: 'wallet',     label: 'Wallets',      icon: Wallet },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rent & Payments</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your monthly rent payments securely.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left panel: Payment methods ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Method tabs */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {METHOD_TABS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setPayMethod(id)}
                className={`w-full flex items-center gap-4 px-5 py-4 border-b border-slate-200/50 last:border-0 text-left transition-colors ${
                  payMethod === id ? 'bg-blue-600/10' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${payMethod === id ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${payMethod === id ? 'text-blue-300' : 'text-slate-700'}`}>{label}</span>
                    {badge && <span className="text-[9px] font-bold bg-emerald-900/60 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded-full tracking-widest">{badge}</span>}
                    {id === 'upi' && <span className="text-[9px] text-slate-500">Recommended</span>}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${payMethod === id ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                  {payMethod === id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {/* UPI sub-panel */}
          {payMethod === 'upi' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Select UPI App</p>
              <div className="grid grid-cols-2 gap-3">
                {UPI_APPS.map(app => (
                  <button
                    key={app.id}
                    onClick={() => setUpiApp(app.id as UPIApp)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      upiApp === app.id ? 'border-blue-500 bg-blue-900/20' : 'border-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ background: app.color }}>
                      {app.abbr}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{app.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">UPI ID</p>
                <div className="flex gap-2">
                  <input
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@bank"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2.5 bg-slate-50 border border-blue-700 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-900/20 transition-colors">
                    VERIFY
                  </button>
                </div>
              </div>
            </div>
          )}

          {(payMethod === 'netbanking' || payMethod === 'card' || payMethod === 'wallet') && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-center text-slate-500 text-sm">
              {payMethod === 'netbanking' ? '🏦 Select your bank on the next screen.' : payMethod === 'card' ? '💳 Card details collected securely on next step.' : '👛 Choose your wallet provider on next step.'}
            </div>
          )}

          {/* Payment history */}
          {payments.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">Payment History</h3>
              </div>
              {payments.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-slate-300 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.month_year}</p>
                    <p className="text-xs text-slate-500">{p.payment_date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(p.amount_paid)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.status === 'paid' ? 'bg-emerald-900/40 text-emerald-400' :
                      p.status === 'late' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'
                    }`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel: Bill Breakdown ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden sticky top-8">
            <div className="px-6 py-5 border-b border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Bill Breakdown</p>
              <p className="font-semibold text-slate-800">{tenancy.unit_number}, {tenancy.properties?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{tenancy.properties?.address}</p>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Base Rent</span>
                <span className="text-slate-800 font-medium">{formatCurrency(tenancy.rent_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Maintenance Charges</span>
                <span className="text-slate-800 font-medium">{formatCurrency(maintenanceFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Convenience Fee</span>
                <span className="text-slate-800 font-medium">{formatCurrency(convenienceFee)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-700">Total Amount</span>
                <span className="text-2xl font-bold text-blue-400">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              {paid ? (
                <div className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-emerald-900/30 border border-emerald-800 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Paid for {currentMonthYear()}
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-lg shadow-blue-900/40 text-sm"
                >
                  {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Pay Now {formatCurrency(total)} <ChevronRight className="w-4 h-4" /></>}
                </button>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-slate-500">
                <Shield className="w-3 h-3" />
                Secure Payment · PCI-DSS Compliant
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
