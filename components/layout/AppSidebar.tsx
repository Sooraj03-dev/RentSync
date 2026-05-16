'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, CreditCard, Wrench,
  Bell, Receipt, Map, LogOut, Home, FileText, Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const landlordNav = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/properties', icon: Building2,        label: 'Properties' },
  { href: '/dashboard/rent',       icon: CreditCard,       label: 'Rent' },
  { href: '/dashboard/maintenance',icon: Wrench,           label: 'Maintenance' },
  { href: '/dashboard/notices',    icon: Bell,             label: 'Notices' },
  { href: '/dashboard/expenses',   icon: Receipt,          label: 'Expenses' },
  { href: '/dashboard/listings',   icon: Map,              label: 'Listings' },
];

const tenantNav = [
  { href: '/tenant',              icon: Home,       label: 'Overview' },
  { href: '/tenant/rent',         icon: Wallet,     label: 'Rent & Pay' },
  { href: '/tenant/maintenance',  icon: Wrench,     label: 'Maintenance' },
  { href: '/tenant/documents',    icon: FileText,   label: 'Documents' },
  { href: '/tenant/notices',      icon: Bell,       label: 'Notices' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useStore((s) => s.role);
  const nav = role === 'tenant' ? tenantNav : landlordNav;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-50 border-r border-slate-300 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-300">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">RentSync</span>
      </div>

      {/* Role badge */}
      <div className="px-6 pt-4 pb-2">
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
          role === 'landlord'
            ? 'bg-indigo-900/60 text-indigo-300'
            : 'bg-emerald-900/60 text-emerald-300'
        )}>
          {role ?? 'loading…'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/tenant' && pathname.startsWith(href));
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
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-300">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
