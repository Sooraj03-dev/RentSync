'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Loader2, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const topNavLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/properties', label: 'Tenants' },
  { href: '/dashboard/expenses', label: 'Insights' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setRole = useStore((s) => s.setRole);
  const setActiveTenancy = useStore((s) => s.setActiveTenancy);
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single();

      if (!profile?.role) { router.push('/register'); return; }
      setRole(profile.role as 'landlord' | 'tenant');
      setUserName(profile.name || user.email?.split('@')[0] || 'User');

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

  const isTenant = pathname.startsWith('/tenant');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          {/* Top Nav Links (landlord only) */}
          {!isTenant ? (
            <nav className="flex items-center gap-1">
              {topNavLinks.map(({ href, label }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-blue-600 border-b-2 border-blue-600 rounded-none font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="text-sm font-semibold text-slate-700">Tenant Portal</div>
          )}

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <Link href="/dashboard/profile" className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-blue-300 transition-all">
              {userName.slice(0, 2).toUpperCase()}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col relative h-full">
          {children}
        </main>
      </div>
      <InstallPrompt />
      <ChatWidget />
    </div>
  );
}
