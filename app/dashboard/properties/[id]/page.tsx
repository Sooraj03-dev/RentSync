'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Building2, Users, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { RentGrid } from '@/components/rent/RentGrid';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<any>(null);
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const [propRes, tenRes, payRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', params.id).single(),
        supabase.from('tenancies').select('*, profiles(name)').eq('property_id', params.id).order('unit_number'),
        supabase.from('rent_payments').select(`
          id, tenancy_id, amount_paid, payment_date, month_year, status,
          tenancies!inner(unit_number, property_id, profiles(name))
        `).eq('tenancies.property_id', params.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setProperty(propRes.data);
      setTenancies(tenRes.data ?? []);
      setPayments(payRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) return <div className="p-8 text-slate-500 text-sm">Loading…</div>;
  if (!property) return <div className="p-8 text-slate-500 text-sm">Property not found.</div>;

  const occupied = tenancies.filter(t => t.status === 'active' && t.tenant_id).length;
  const totalRent = tenancies.filter(t => t.status === 'active').reduce((s, t) => s + (t.rent_amount ?? 0), 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Link href="/dashboard/properties" className="hover:text-slate-700 transition-colors">Properties</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700">{property.name}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-900/40 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{property.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{property.address}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-200/50 pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Total Units</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{property.total_units}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Occupied</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{occupied}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Monthly Revenue</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalRent)}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Tenancies</h2>
        {tenancies.length === 0 ? (
          <p className="text-slate-500 text-sm">No tenancies yet.</p>
        ) : (
          <div className="space-y-2">
            {tenancies.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{t.profiles?.name ?? 'Vacant'} — {t.unit_number}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(t.rent_amount)}/mo · Due day {t.due_day}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Recent Payments</h2>
        <RentGrid rows={payments as Parameters<typeof RentGrid>[0]['rows']} />
      </div>
    </div>
  );
}
