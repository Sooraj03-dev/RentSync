'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TicketCard } from '@/components/maintenance/TicketCard';
import { useRealtime } from '@/lib/hooks/useRealtime';
import { Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardMaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('maintenance_requests')
        .select(`
          id, tenancy_id, title, category, status, landlord_note, created_at,
          tenancies!inner(unit_number, property_id, profiles(name), properties!inner(landlord_id))
        `)
        .eq('tenancies.properties.landlord_id', user.id)
        .order('created_at', { ascending: false });
      setTickets(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const handleRealtime = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') setTickets(prev => [payload.new, ...prev]);
    else if (payload.eventType === 'UPDATE') setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
  }, []);

  useRealtime('maintenance_requests', handleRealtime);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
        <p className="text-slate-500 mt-1 text-sm">Live view of all tickets across your properties.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Wrench className="w-12 h-12 mb-3 text-slate-700" />
          <p className="text-sm">No maintenance requests.</p>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map(t => <TicketCard key={t.id} ticket={t} isLandlord />)}
      </div>
    </div>
  );
}
