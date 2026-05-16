'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Wrench, CheckCircle2, Clock, AlertCircle, ChevronDown } from 'lucide-react';

interface MaintenanceTicket {
  id: string;
  tenancy_id: string;
  title: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  landlord_note: string | null;
  created_at: string;
  tenancies?: {
    unit_number: string;
    profiles?: { name: string };
  };
}

const statusConfig = {
  open:        { label: 'Open',        icon: AlertCircle, color: 'text-red-400',    bg: 'bg-red-900/40 border-red-800' },
  in_progress: { label: 'In Progress', icon: Clock,       color: 'text-yellow-400', bg: 'bg-yellow-900/40 border-yellow-800' },
  resolved:    { label: 'Resolved',    icon: CheckCircle2,color: 'text-emerald-400',bg: 'bg-emerald-900/40 border-emerald-800' },
};

const categoryLabel: Record<string, string> = {
  plumbing: '🔧 Plumbing', electrical: '⚡ Electrical',
  cleaning: '🧹 Cleaning', other: '📋 Other',
};

export function TicketCard({ ticket: initial, isLandlord }: { ticket: MaintenanceTicket; isLandlord?: boolean }) {
  const [ticket, setTicket] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(ticket.landlord_note ?? '');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const cfg = statusConfig[ticket.status];
  const StatusIcon = cfg.icon;

  const updateStatus = async (status: MaintenanceTicket['status']) => {
    setSaving(true);
    const { error } = await supabase
      .from('maintenance_requests')
      .update({ status })
      .eq('id', ticket.id);
    if (!error) setTicket(t => ({ ...t, status }));
    setSaving(false);
  };

  const saveNote = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('maintenance_requests')
      .update({ landlord_note: note })
      .eq('id', ticket.id);
    if (!error) setTicket(t => ({ ...t, landlord_note: note }));
    setSaving(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
          <Wrench className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{ticket.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{categoryLabel[ticket.category]}</span>
            {ticket.tenancies && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">
                  {ticket.tenancies.profiles?.name} — {ticket.tenancies.unit_number}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
          <span className="text-xs text-slate-500">{formatDate(ticket.created_at)}</span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded landlord controls */}
      {expanded && isLandlord && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-200/50">
          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Update Status</p>
            <div className="flex gap-2 flex-wrap">
              {(['open', 'in_progress', 'resolved'] as const).map(s => (
                <button
                  key={s}
                  disabled={saving || ticket.status === s}
                  onClick={() => updateStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 border ${
                    ticket.status === s
                      ? `${statusConfig[s].bg} ${statusConfig[s].color}`
                      : 'border-slate-200 text-slate-500 hover:border-slate-600 hover:text-slate-800'
                  }`}
                >
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Landlord Note</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note for the tenant…"
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={saveNote}
              disabled={saving}
              className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>
      )}

      {/* Tenant view: show landlord note */}
      {expanded && !isLandlord && ticket.landlord_note && (
        <div className="px-5 pb-4 border-t border-slate-200/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-4 mb-1">Note from Landlord</p>
          <p className="text-sm text-slate-700">{ticket.landlord_note}</p>
        </div>
      )}
    </div>
  );
}
