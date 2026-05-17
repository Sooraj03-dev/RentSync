'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, ShieldCheck, CheckCircle2, UploadCloud, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  }, [supabase]);

  const calculateCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name) score += 25;
    if (profile.email) score += 25;
    if (profile.phone) score += 20;
    if (profile.aadhaar_no || profile.pan_no) score += 30; // KYC
    return score;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        phone: profile.phone,
        aadhaar_no: profile.aadhaar_no,
        pan_no: profile.pan_no
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) alert('Failed to save profile');
    else alert('Profile updated successfully!');
  };

  if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const score = calculateCompletion();
  const isVerified = score === 100;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your identity and KYC documents.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0 relative">
          {profile?.name?.charAt(0) || 'U'}
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 pt-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{profile?.name || 'Unknown User'}</h2>
            {isVerified && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Verified</span>}
          </div>
          <p className="text-slate-500 text-sm mt-1">{profile?.email}</p>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className={score === 100 ? 'text-emerald-600' : 'text-slate-500'}>Profile Completion</span>
              <span className={score === 100 ? 'text-emerald-600' : 'text-slate-700'}>{score}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${score === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                style={{ width: `${score}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Personal Details</h3>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input type="text" value={profile?.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
            <input type="tel" value={profile?.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 pt-4 flex items-center gap-2">
          KYC Verification <ShieldCheck className="w-5 h-5 text-blue-500" />
        </h3>
        <p className="text-sm text-slate-500">Provide at least one document to receive your Authentic Verified badge.</p>
        
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Aadhaar Number</label>
            <input type="text" value={profile?.aadhaar_no || ''} onChange={e => setProfile({...profile, aadhaar_no: e.target.value})} placeholder="XXXX-XXXX-XXXX" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">PAN Number</label>
            <input type="text" value={profile?.pan_no || ''} onChange={e => setProfile({...profile, pan_no: e.target.value})} placeholder="ABCDE1234F" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 uppercase" />
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
