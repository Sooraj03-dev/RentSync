'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCode } from '@/lib/utils/inviteCode';
import type { PropertyInvite } from '@/types/invite';
import { Copy, RefreshCw, X, MessageCircle, Send, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  propertyId: string;
  totalUnits: number;
  propertyName: string;
}

interface ModalState {
  unitNumber: string;
  existingInviteId?: string;
}

function getExpiryInfo(expiresAt: string) {
  const msLeft = new Date(expiresAt).getTime() - Date.now();
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);
  if (msLeft < 0) return { label: 'Expired', color: 'text-red-600 bg-red-50 border-red-200' };
  if (daysLeft < 1) return { label: `${Math.round(daysLeft * 24)}h left`, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { label: `${Math.floor(daysLeft)}d left`, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
      {msg}
    </div>
  );
}

export function UnitInvitePanel({ propertyId, totalUnits, propertyName }: Props) {
  const [invites, setInvites] = useState<PropertyInvite[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ rent_amount: '', due_day: '1', assigned_email: '' });
  const supabase = createClient();

  const fetchInvites = useCallback(async () => {
    const res = await fetch(`/api/invites/list?property_id=${propertyId}`);
    const data = await res.json();
    setInvites(data.invites ?? []);
  }, [propertyId]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`invites-${propertyId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'property_invites',
        filter: `property_id=eq.${propertyId}`,
      }, (payload: any) => {
        if (payload.new?.status === 'accepted') {
          setToast(`🎉 Tenant joined Unit ${payload.new.unit_number}!`);
        }
        fetchInvites();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [propertyId, fetchInvites, supabase]);

  const getInviteForUnit = (unit: string) =>
    invites.find(i => i.unit_number === unit && i.status !== 'revoked' && i.status !== 'expired');

  const handleGenerate = async () => {
    if (!modal) return;
    setLoading(true);
    try {
      const res = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          unit_number: modal.unitNumber,
          rent_amount: parseFloat(form.rent_amount) || 0,
          due_day: parseInt(form.due_day) || 1,
          assigned_email: form.assigned_email || undefined,
        }),
      });
      await res.json();
      await fetchInvites();
      setModal(null);
      setForm({ rent_amount: '', due_day: '1', assigned_email: '' });
      setToast('✅ Invite code generated!');
    } catch {
      setToast('❌ Failed to generate invite');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (invite: PropertyInvite) => {
    if (!confirm('Revoke this invite? The code will stop working.')) return;
    await fetch('/api/invites/revoke', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: invite.id }),
    });
    await fetchInvites();
    setToast('Invite revoked.');
  };

  const handleRegenerate = async (invite: PropertyInvite) => {
    if (!confirm('Regenerate code? The old code will be invalidated.')) return;
    await fetch('/api/invites/regenerate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: invite.id }),
    });
    await fetchInvites();
    setToast('New code generated!');
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast('📋 Code copied!');
  };

  const handleWhatsApp = (invite: PropertyInvite) => {
    const msg = `You've been invited to Unit ${invite.unit_number} at ${propertyName}. Your RentSync code: ${formatCode(invite.code)}. Valid 7 days. Visit rentsync.vercel.app/onboard`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const units = Array.from({ length: Math.max(totalUnits, 1) }, (_, i) => `${i + 1}`);

  return (
    <div className="mt-6 border-t border-slate-200/50 pt-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Units &amp; Invites</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {units.map(unit => {
          const invite = getInviteForUnit(unit);
          const expiry = invite && invite.status === 'pending' ? getExpiryInfo(invite.expires_at) : null;

          return (
            <div key={unit} className="border border-slate-200 rounded-xl p-4 bg-white">
              {/* No invite */}
              {!invite && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Unit {unit}</p>
                    <p className="text-xs text-slate-400 mt-0.5">No active invite</p>
                  </div>
                  <button
                    onClick={() => { setModal({ unitNumber: unit }); setForm({ rent_amount: '', due_day: '1', assigned_email: '' }); }}
                    className="text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Send Invite
                  </button>
                </div>
              )}

              {/* Pending invite */}
              {invite?.status === 'pending' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-700">Unit {unit}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${expiry?.color}`}>
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                      {expiry?.label}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-slate-800 tracking-widest">{formatCode(invite.code)}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => handleCopy(invite.code)} className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button onClick={() => handleWhatsApp(invite)} className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </button>
                    <button onClick={() => handleRegenerate(invite)} className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                    <button onClick={() => handleRevoke(invite)} className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                      <X className="w-3 h-3" /> Revoke
                    </button>
                  </div>
                </div>
              )}

              {/* Accepted */}
              {invite?.status === 'accepted' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-sm font-bold text-slate-700">Unit {unit}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Occupied
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Accepted {invite.accepted_at ? new Date(invite.accepted_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Send Invite Modal */}
      {modal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-bold text-slate-900">Send Invite — Unit {modal.unitNumber}</h4>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rent Amount (₹/mo)</label>
                <input type="number" value={form.rent_amount} onChange={e => setForm(f => ({ ...f, rent_amount: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 12000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Due Day (1–28)</label>
                <select value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant Email (optional)</label>
                <input type="email" value={form.assigned_email} onChange={e => setForm(f => ({ ...f, assigned_email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="tenant@email.com" />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !form.rent_amount}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Generating…' : 'Generate Invite Code'}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  );
}
