'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { Loader2 } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setRole = useStore((s) => s.setRole);
  const setActiveTenancy = useStore((s) => s.setActiveTenancy);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role) { router.push('/register'); return; }
      setRole(profile.role as 'landlord' | 'tenant');

      if (profile.role === 'tenant') {
        const { data: tenancy } = await supabase
          .from('tenancies')
          .select('id')
          .eq('tenant_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (tenancy) setActiveTenancy(tenancy.id);
      }

      setReady(true);
    };

    init();
  }, [router, setRole, setActiveTenancy]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50 scrollbar-thin">
        {children}
      </main>
      <InstallPrompt />
    </div>
  );
}
