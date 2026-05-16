'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NoticeBoard } from '@/components/notices/NoticeBoard';
import { Bell } from 'lucide-react';

export default function TenantNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: t } = await supabase
        .from('tenancies')
        .select('id, property_id')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (!t) { setLoading(false); return; }
      setPropertyId(t.property_id);
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('property_id', t.property_id)
        .order('created_at', { ascending: false });
      setNotices(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notices</h1>
        <p className="text-slate-500 mt-1 text-sm">Announcements from your landlord — live updates enabled.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && !propertyId && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Bell className="w-12 h-12 mb-3 text-slate-700" />
          <p className="text-sm">No active tenancy found.</p>
        </div>
      )}

      {!loading && propertyId && (
        <NoticeBoard initialNotices={notices} propertyId={propertyId} />
      )}
    </div>
  );
}
