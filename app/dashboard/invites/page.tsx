'use client';

import { useState, useEffect } from 'react';
import { formatCode } from '@/lib/utils/inviteCode';
import type { PropertyInvite } from '@/types/invite';
import { Copy, RefreshCw, X, Clock, CheckCircle2, XCircle, AlertTriangle, Key } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  revoked:  'bg-slate-100 text-slate-500 border-slate-200',
  expired:  'bg-red-50 text-red-600 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:  <Clock className="w-3 h-3" />,
  accepted: <CheckCircle2 className="w-3 h-3" />,
  revoked:  <XCircle className="w-3 h-3" />,
  expired:  <AlertTriangle className="w-3 h-3" />,
};

type Tab = 'all' | 'pending' | 'accepted' | 'revoked';

export default function InvitesPage() {
  const [invites, setInvites] = useState<PropertyInvite[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInvites = async () => {
    setLoading(true);
    const res = await fetch('/api/invites/list');
    const data = await res.json();
    setInvites(data.invites ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchInvites(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleRevoke = async (invite: PropertyInvite) => {
    if (!confirm('Revoke this invite?')) return;
    await fetch('/api/invites/revoke', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: invite.id }),
    });
    showToast('Invite revoked.');
    fetchInvites();
  };

  const handleRegenerate = async (invite: PropertyInvite) => {
    if (!confirm('Regenerate code? Old code will stop working.')) return;
    await fetch('/api/invites/regenerate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: invite.id }),
    });
    showToast('New code generated!');
    fetchInvites();
  };

  const pendingCount = invites.filter(i => i.status === 'pending').length;

  const filtered = invites.filter(i => {
    if (tab === 'all') return true;
    if (tab === 'revoked') return i.status === 'revoked' || i.status === 'expired';
    return i.status === tab;
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: invites.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'accepted', label: 'Accepted', count: invites.filter(i => i.status === 'accepted').length },
    { key: 'revoked', label: 'Revoked / Expired' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Key className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invite Codes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage tenant invitations across all properties.</p>
        </div>
        {pendingCount > 0 && (
          <span className="ml-2 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-slate-400 py-10 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Key className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="font-medium text-slate-500">No invites found</p>
          <p className="text-sm mt-1">Go to a property to generate invite codes for units.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Unit', 'Code', 'Status', 'Assigned Email', 'Rent', 'Expires', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(invite => {
                const msLeft = new Date(invite.expires_at).getTime() - Date.now();
                const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
                const isExpired = msLeft < 0;

                return (
                  <tr key={invite.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">Unit {invite.unit_number}</td>
                    <td className="px-4 py-3">
                      {invite.status === 'pending' ? (
                        <span className="font-mono font-bold text-slate-800 tracking-widest bg-slate-100 px-2 py-1 rounded-lg">
                          {formatCode(invite.code)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">{invite.code}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[isExpired && invite.status === 'pending' ? 'expired' : invite.status]}`}>
                        {STATUS_ICONS[isExpired && invite.status === 'pending' ? 'expired' : invite.status]}
                        {isExpired && invite.status === 'pending' ? 'expired' : invite.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{invite.assigned_email ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">₹{invite.rent_amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">
                      {invite.status === 'pending' && !isExpired ? (
                        <span className={daysLeft < 1 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                          {daysLeft < 1 ? `<24h` : `${daysLeft}d`}
                        </span>
                      ) : isExpired ? (
                        <span className="text-red-500 font-semibold">Expired</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {invite.status === 'pending' && (
                          <>
                            <button onClick={() => { navigator.clipboard.writeText(invite.code); showToast('📋 Code copied!'); }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Copy">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleRegenerate(invite)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Regenerate">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleRevoke(invite)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revoke">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
