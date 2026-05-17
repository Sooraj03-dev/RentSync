'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Plus, X, Download, TrendingDown } from 'lucide-react';

const CATEGORIES = ['repairs', 'utilities', 'maintenance', 'staff', 'other'] as const;
const COLORS: Record<string, string> = {
  repairs: '#3B82F6', utilities: '#10B981', maintenance: '#F59E0B', staff: '#8B5CF6', other: '#6B7280',
};

export default function DashboardExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProp, setSelectedProp] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'repairs', amount: '', description: '', expense_date: new Date().toISOString().slice(0,10) });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: props } = await supabase.from('properties').select('id,name').eq('owner_id', user.id);
      setProperties(props ?? []);
      if (props && props.length > 0) {
        setSelectedProp(props[0].id);
        loadExpenses(props[0].id);
      }
    };
    load();
  }, []);

  const loadExpenses = async (propId: string) => {
    const { data } = await supabase.from('expenses').select('*').eq('property_id', propId).order('expense_date', { ascending: false });
    setExpenses(data ?? []);
  };

  const handleSave = async () => {
    if (!form.amount || !selectedProp) return;
    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum)) {
      alert('Please enter a valid amount');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('expenses').insert({ 
      ...form, 
      amount: amountNum, 
      property_id: selectedProp 
    });

    if (error) {
      console.error('Save expense error:', error);
      alert(`Failed to save expense: ${error.message}`);
    } else {
      await loadExpenses(selectedProp);
      setForm({ category: 'repairs', amount: '', description: '', expense_date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const header = 'Date,Category,Amount,Description\n';
    const rows = expenses.map(e => `${e.expense_date},${e.category},${e.amount},"${e.description ?? ''}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Pie chart data
  const byCategory = CATEGORIES.map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(d => d.total > 0);
  const grandTotal = byCategory.reduce((s, d) => s + d.total, 0);

  // Simple SVG pie
  let cumAngle = 0;
  const slices = byCategory.map(d => {
    const angle = (d.total / grandTotal) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const start = polarToCartesian(100, 100, 80, startAngle);
    const end = polarToCartesian(100, 100, 80, cumAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M100,100 L${start.x},${start.y} A80,80 0 ${largeArc},1 ${end.x},${end.y} Z`;
    return { ...d, path, angle };
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Log</h1>
          <p className="text-slate-500 mt-1 text-sm">Track property running costs.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </div>

      {properties.length > 1 && (
        <select value={selectedProp} onChange={e => { setSelectedProp(e.target.value); loadExpenses(e.target.value); }}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">Date</label>
            <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">Description</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Lift maintenance" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2 flex justify-end">
            <button onClick={handleSave} disabled={saving || !form.amount}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Expense'}
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        {slices.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Spend by Category</h3>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 200 200" className="w-56 h-56">
                {slices.map(s => s.angle >= 359.9 ? (
                  <circle key={s.cat} cx="100" cy="100" r="80" fill={COLORS[s.cat]} opacity={0.85} />
                ) : (
                  <path key={s.cat} d={s.path} fill={COLORS[s.cat]} opacity={0.85} />
                ))}
                <circle cx="100" cy="100" r="45" fill="#1E293B" />
                <text x="100" y="96" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="bold">Total</text>
                <text x="100" y="110" textAnchor="middle" fill="#94A3B8" fontSize="8">₹{grandTotal.toLocaleString('en-IN')}</text>
              </svg>
              <div className="mt-4 space-y-1.5 w-full">
                {byCategory.map(d => (
                  <div key={d.cat} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[d.cat] }} />
                      <span className="text-slate-500 capitalize">{d.cat}</span>
                    </div>
                    <span className="text-slate-700 font-semibold">{formatCurrency(d.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expense list */}
        <div className={`${slices.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white border border-slate-200 rounded-xl overflow-hidden`}>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <TrendingDown className="w-10 h-10 mb-3 text-slate-700" />
              <p className="text-sm">No expenses recorded.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{formatDate(e.expense_date)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[e.category] }} />
                        <span className="text-slate-700 capitalize">{e.category}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{e.description ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
