'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, Wrench,
  Bell, Receipt, LogOut, Home, FileText, Wallet,
  Key, MessageSquare, Settings, HelpCircle, MapPin,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const landlordNav = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Overview',    badge: null },
  { href: '/dashboard/properties',   icon: Building2,       label: 'Properties',  badge: null },
  { href: '/dashboard/invites',      icon: Key,             label: 'Invites',     badge: 'pendingInvites' },
  { href: '/dashboard/messages',     icon: MessageSquare,   label: 'Messages',    badge: 'unreadMessages' },
  { href: '/dashboard/rent',         icon: CreditCard,      label: 'Rent',        badge: null },
  { href: '/dashboard/maintenance',  icon: Wrench,          label: 'Maintenance', badge: null },
  { href: '/dashboard/notices',      icon: Bell,            label: 'Notices',     badge: null },
  { href: '/dashboard/expenses',     icon: Receipt,         label: 'Expenses',    badge: null },
];

const tenantNavFull = [
  { href: '/tenant',              icon: Home,         label: 'Dashboard',   badge: null },
  { href: '/tenant/find',         icon: MapPin,       label: 'Find a Home', badge: 'new' },
  { href: '/tenant/rent',         icon: Wallet,       label: 'Payments',    badge: null },
  { href: '/tenant/maintenance',  icon: Wrench,       label: 'Maintenance', badge: null },
  { href: '/tenant/documents',    icon: FileText,     label: 'Documents',   badge: null },
  { href: '/tenant/notices',      icon: Bell,         label: 'Notices',     badge: null },
  { href: '/tenant/messages',     icon: MessageSquare,label: 'Messages',    badge: 'unreadMessages' },
];

const tenantNavEmpty = [
  { href: '/tenant', icon: Key, label: 'Join Property', badge: null },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useStore((s) => s.role);
  const activeTenancyId = useStore((s) => s.activeTenancyId);
  const totalUnread = useStore((s) => s.totalUnread);
  const setTotalUnread = useStore((s) => s.setTotalUnread);
  const nav = role === 'tenant'
    ? (activeTenancyId ? tenantNavFull : tenantNavEmpty)
    : landlordNav;
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('JD');
  const [pendingInvites, setPendingInvites] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('name').eq('id', user.id).single()
        .then(({ data }) => {
          const name = data?.name || user.email?.split('@')[0] || 'User';
          setUserName(name);
          setUserInitials(name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));
        });
      // Fetch badge counts
      if (role === 'landlord') {
        fetch('/api/invites/list').then(r => r.json()).then(d => {
          setPendingInvites((d.invites ?? []).filter((i: any) => i.status === 'pending').length);
        }).catch(() => {});
        fetch('/api/chat/conversations').then(r => r.json()).then(d => {
          setUnreadMessages((d.conversations ?? []).reduce((s: number, c: any) => s + (c.landlord_unread ?? 0), 0));
        }).catch(() => {});
      } else if (role === 'tenant') {
        fetch('/api/chat/conversations').then(r => r.json()).then(d => {
          const unread = (d.conversations ?? []).reduce((s: number, c: any) => s + (c.tenant_unread ?? 0), 0);
          setTotalUnread(unread);
        }).catch(() => {});
      }
    });
  }, [role, setTotalUnread]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const [propertyName, setPropertyName] = useState('RentSync');

  useEffect(() => {
    if (role === 'tenant' && activeTenancyId) {
      const supabase = createClient();
      supabase.from('tenancies').select('properties(name)').eq('id', activeTenancyId).single()
        .then(({ data }) => {
          const name = (data as any)?.properties?.name;
          if (name) setPropertyName(name);
        }).catch(() => {});
    }
  }, [role, activeTenancyId]);

  if (role === 'tenant') {
    return (
      <aside className="flex flex-col w-56 min-h-screen bg-white border-r border-slate-200 shrink-0">
        {/* Property header */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">{propertyName}</p>
              <p className="text-[10px] text-slate-400 font-medium">Tenant Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, icon: Icon, label, badge }: any) => {
            const active = pathname === href || (href !== '/tenant' && pathname.startsWith(href));
            const badgeCount = badge === 'unreadMessages' ? totalUnread : 0;
            const isNew = badge === 'new';
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isNew && (
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white')}>
                    New
                  </span>
                )}
                {badgeCount > 0 && (
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-white/20' : 'bg-blue-600 text-white')}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-slate-100 pt-3">
          <Link href="/tenant/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <Link href="/tenant/support"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <HelpCircle className="w-4 h-4" /> Support
          </Link>
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Pay Rent button */}
        {activeTenancyId && (
          <div className="px-4 pb-5">
            <Link href="/tenant/rent"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-center text-sm transition-colors shadow-sm shadow-blue-200">
              Pay Rent
            </Link>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-50 border-r border-slate-300 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-300">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800">RentSync</span>
      </div>

      {/* Role badge */}
      <div className="px-6 pt-4 pb-2">
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
          role === 'landlord'
            ? 'bg-indigo-100 text-indigo-700'
            : 'bg-emerald-100 text-emerald-700'
        )}>
          {role ?? 'loading…'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ href, icon: Icon, label, badge }: any) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/tenant' && pathname.startsWith(href));
          const badgeCount = badge === 'pendingInvites' ? pendingInvites
            : badge === 'unreadMessages' ? (role === 'tenant' ? totalUnread : unreadMessages)
            : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badgeCount > 0 && (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center', active ? 'bg-white/20 text-white' : 'bg-blue-600 text-white')}>
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-2 border-t border-slate-300">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all mb-1"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userInitials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{userName || 'Profile'}</p>
            <p className="text-[10px] text-slate-400">Edit profile &amp; KYC</p>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
