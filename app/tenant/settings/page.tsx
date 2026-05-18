'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  User, Bell, Shield, Moon, Globe, Smartphone, ChevronRight,
  ShieldCheck, CheckCircle2, Loader2, LogOut, KeyRound, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TenantSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({ rent: true, maintenance: true, notices: true });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile({ ...data, email: user.email });
      }
      setLoading(false);
    };
    load();
  }, []);

  const calculateCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name) score += 25;
    if (profile.email) score += 25;
    if (profile.phone) score += 20;
    if (profile.aadhaar_no || profile.pan_no) score += 30;
    return score;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
      </div>
    );
  }

  const score = calculateCompletion();
  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account preferences.</p>
      </div>

      {/* Profile card with verification progress */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900">{profile?.name || 'Your Name'}</p>
              {score === 100 && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{profile?.email}</p>
          </div>
          <Link href="/dashboard/profile"
            className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
            Edit <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Verification progress */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" /> Verification Progress
            </span>
            <span className={`text-xs font-bold ${score === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{score}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${score === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: 'Full Name', done: !!profile?.name },
              { label: 'Email', done: !!profile?.email },
              { label: 'Phone Number', done: !!profile?.phone },
              { label: 'KYC (Aadhaar/PAN)', done: !!(profile?.aadhaar_no || profile?.pan_no) },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={done ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
              </div>
            ))}
          </div>
          {score < 100 && (
            <Link href="/dashboard/profile"
              className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
              Complete Verification →
            </Link>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-blue-500" /> Notifications
        </h3>
        <div className="space-y-3">
          {[
            { key: 'rent', label: 'Rent Due Reminders', desc: 'Get notified before rent is due' },
            { key: 'maintenance', label: 'Maintenance Updates', desc: 'Status changes on your requests' },
            { key: 'notices', label: 'Building Notices', desc: 'Important announcements from landlord' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${(notifications as any)[key] ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${(notifications as any)[key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* App preferences */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-blue-500" /> Preferences
        </h3>
        <div className="space-y-1">
          {[
            { icon: Smartphone, label: 'Language', value: 'English' },
            { icon: Moon, label: 'Theme', value: 'System Default' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{label}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-sm">{value}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-blue-500" /> Account
        </h3>
        <Link href="/dashboard/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
          <User className="w-4 h-4" /> Edit Profile & KYC
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">RentSync · v1.0.0 · Encrypted · Supabase</p>
    </div>
  );
}
