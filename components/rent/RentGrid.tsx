'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, Download, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RentRow {
  id: string;
  tenancy_id: string;
  amount_paid: number;
  payment_date: string;
  month_year: string;
  status: 'paid' | 'pending' | 'late';
  tenancies?: {
    unit_number: string;
    profiles?: { name: string };
  };
}

interface RentGridProps {
  rows: RentRow[];
  onMarkPaid?: (id: string) => void;
}

const statusConfig = {
  paid:    { label: 'Paid',    icon: CheckCircle2, color: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' },
  pending: { label: 'Pending', icon: Clock,        color: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' },
  late:    { label: 'Late',    icon: AlertCircle,  color: 'bg-red-900/40 text-red-400 border border-red-800' },
};

export function RentGrid({ rows: initialRows, onMarkPaid }: RentGridProps) {
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const markPaid = async (id: string) => {
    setLoading(id);
    const { error } = await supabase
      .from('rent_payments')
      .update({ status: 'paid', payment_date: new Date().toISOString().slice(0, 10) })
      .eq('id', id);

    if (!error) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'paid' } : r));
      onMarkPaid?.(id);
    }
    setLoading(null);
  };

  const downloadReceipt = async (row: RentRow) => {
    const res = await fetch(`/api/export/rent?payment_id=${row.id}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${row.month_year}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <CheckCheck className="w-12 h-12 mb-3 text-slate-700" />
        <p className="text-sm">No rent records yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Tenant</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Unit</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Month</th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Amount</th>
            <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
            <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row) => {
            const cfg = statusConfig[row.status];
            const StatusIcon = cfg.icon;
            return (
              <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {row.tenancies?.profiles?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {row.tenancies?.unit_number ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-500">{row.month_year}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {formatCurrency(row.amount_paid)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {row.status !== 'paid' && (
                      <button
                        onClick={() => markPaid(row.id)}
                        disabled={loading === row.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {loading === row.id ? 'Saving…' : 'Mark Paid'}
                      </button>
                    )}
                    {row.status === 'paid' && (
                      <button
                        onClick={() => downloadReceipt(row)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Receipt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
