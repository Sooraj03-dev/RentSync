'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { CodeInput } from './CodeInput';
import { Building2, MapPin, ArrowLeft, CheckCircle2, X } from 'lucide-react';

type Step = 'code' | 'preview' | 'success';

interface InvitePreview {
  id: string;
  unit_number: string;
  rent_amount: number;
  due_day: number;
  expires_at: string;
  property_name: string;
  property_address: string;
}

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function CodeEntryModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('code');
  const [verifying, setVerifying] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const { setActiveTenancy } = useStore();
  const router = useRouter();
  const supabase = createClient();

  const handleCodeComplete = async (code: string) => {
    setVerifying(true);
    setCodeError('');
    try {
      const res = await fetch('/api/invites/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error || 'Invalid code'); setVerifying(false); return; }
      setInvite(data.invite);
      setStep('preview');
    } catch {
      setCodeError('Something went wrong. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleAccept = async () => {
    if (!invite) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      sessionStorage.setItem('rentsync_pending_invite', invite.id);
      router.push('/login?next=/onboard');
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role === 'landlord') {
      alert('Switch to a tenant account to accept this invite.');
      return;
    }
    setAccepting(true);
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: invite.id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to join'); return; }
      setActiveTenancy(data.tenancy.id);
      sessionStorage.removeItem('rentsync_pending_invite');
      setStep('success');
    } catch {
      alert('Something went wrong.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-0 right-0 text-slate-400 hover:text-slate-600 p-1">
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Step 1 — Code entry */}
      {step === 'code' && (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🔑</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Enter Invite Code</h2>
            <p className="text-slate-500 text-sm mt-1">Ask your landlord for the 6-character code</p>
          </div>
          <CodeInput onComplete={handleCodeComplete} loading={verifying} error={codeError} />
          {verifying && <p className="text-blue-600 text-sm font-medium animate-pulse">Verifying…</p>}
        </div>
      )}

      {/* Step 2 — Preview */}
      {step === 'preview' && invite && (
        <div className="flex flex-col gap-5 py-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{invite.property_name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{invite.property_address}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Unit', value: invite.unit_number },
                { label: 'Monthly rent', value: `₹${invite.rent_amount.toLocaleString()}` },
                { label: 'Due date', value: `${ordinal(invite.due_day)} of every month` },
                { label: 'Code valid', value: `until ${new Date(invite.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{row.label}</span>
                  <span className="text-sm font-bold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('code')}
              className="flex items-center gap-1.5 flex-1 justify-center border border-slate-300 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Change code
            </button>
            <button onClick={handleAccept} disabled={accepting}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {accepting ? 'Joining…' : 'Accept & Join →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Success */}
      {step === 'success' && invite && (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to {invite.property_name}, Unit {invite.unit_number}!</h2>
            <p className="text-slate-500 text-sm mt-2">
              Your first rent of ₹{invite.rent_amount.toLocaleString()} is due on the {ordinal(invite.due_day)}.
            </p>
          </div>
          <button onClick={() => { onSuccess?.(); router.push('/tenant'); router.refresh(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors">
            Go to my dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
