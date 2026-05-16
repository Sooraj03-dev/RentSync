'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NoticeBoard } from '@/components/notices/NoticeBoard';
import { Pin, Plus, X } from 'lucide-react';

export default function DashboardNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProp, setSelectedProp] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: props } = await supabase.from('properties').select('id, name').eq('landlord_id', user.id);
      setProperties(props ?? []);
      if (props && props.length > 0) {
        setSelectedProp(props[0].id);
        const { data } = await supabase.from('notices').select('*').eq('property_id', props[0].id).order('created_at', { ascending: false });
        setNotices(data ?? []);
      }
    };
    load();
  }, []);

  const handlePropChange = async (id: string) => {
    setSelectedProp(id);
    const { data } = await supabase.from('notices').select('*').eq('property_id', id).order('created_at', { ascending: false });
    setNotices(data ?? []);
  };

  const handlePost = async () => {
    if (!title.trim() || !selectedProp) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('notices').insert({ property_id: selectedProp, landlord_id: user!.id, title, body, pinned });
    setTitle(''); setBody(''); setPinned(false); setShowForm(false);
    const { data } = await supabase.from('notices').select('*').eq('property_id', selectedProp).order('created_at', { ascending: false });
    setNotices(data ?? []);
    setSaving(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notice Board</h1>
          <p className="text-slate-500 mt-1 text-sm">Post announcements to your tenants.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Notice'}
        </button>
      </div>

      {/* Property selector */}
      {properties.length > 1 && (
        <select
          value={selectedProp}
          onChange={e => handlePropChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {/* Post form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Notice title"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Notice body (optional)"
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="accent-blue-500" />
              <Pin className="w-3.5 h-3.5 text-blue-400" /> Pin this notice
            </label>
            <button
              onClick={handlePost}
              disabled={saving || !title.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Posting…' : 'Post Notice'}
            </button>
          </div>
        </div>
      )}

      {selectedProp && <NoticeBoard initialNotices={notices} propertyId={selectedProp} />}
    </div>
  );
}
