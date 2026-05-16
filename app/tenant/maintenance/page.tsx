'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TicketCard } from '@/components/maintenance/TicketCard';
import { Wrench, Plus, X, Loader2 } from 'lucide-react';

const CATEGORIES = ['plumbing', 'electrical', 'cleaning', 'other'] as const;

export default function TenantMaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [tenancyId, setTenancyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'plumbing' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: t } = await supabase.from('tenancies').select('id').eq('tenant_id', user.id).eq('status', 'active').maybeSingle();
      if (!t) { setLoading(false); return; }
      setTenancyId(t.id);
      const { data } = await supabase.from('maintenance_requests').select('*').eq('tenancy_id', t.id).order('created_at', { ascending: false });
      setTickets(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !tenancyId) return;
    setSubmitting(true);
    const { data, error } = await supabase.from('maintenance_requests')
      .insert({ tenancy_id: tenancyId, title: form.title, category: form.category })
      .select()
      .single();
    if (!error && data) {
      setTickets(prev => [data, ...prev]);
      // Notify landlord
      await fetch('/api/maintenance/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenancy_id: tenancyId, title: form.title, category: form.category }),
      });
      setForm({ title: '', category: 'plumbing' });
      setShowForm(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-500 mt-1 text-sm">Raise and track maintenance requests.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Raise Ticket'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">Issue Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Leaking tap in bathroom"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}

      {loading && <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>}
      {!loading && tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Wrench className="w-12 h-12 mb-3 text-slate-700" />
          <p className="text-sm">No maintenance requests.</p>
        </div>
      )}
      <div className="space-y-3">
        {tickets.map(t => <TicketCard key={t.id} ticket={t} isLandlord={false} />)}
      </div>
    </div>
  );
}
