'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRealtime } from '@/lib/hooks/useRealtime';
import { formatDate } from '@/lib/utils';
import { Pin, MessageCircle } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  body: string | null;
  pinned: boolean;
  created_at: string;
  property_id: string;
}

export function NoticeBoard({ initialNotices, propertyId }: { initialNotices: Notice[]; propertyId: string }) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);

  // Sync state if parent fetches new notices
  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  const handleRealtime = useCallback((payload: { eventType: string; new: Notice; old: Notice }) => {
    if (payload.eventType === 'INSERT') {
      setNotices(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setNotices(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
    } else if (payload.eventType === 'DELETE') {
      setNotices(prev => prev.filter(n => n.id !== payload.old.id));
    }
  }, []);

  useRealtime('notices', handleRealtime, `property_id=eq.${propertyId}`);

  const sorted = [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const shareOnWhatsApp = (notice: Notice) => {
    const text = encodeURIComponent(`📢 *${notice.title}*\n\n${notice.body ?? ''}\n\n— RentSync`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Pin className="w-10 h-10 mb-3 text-slate-700" />
        <p className="text-sm">No notices yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(notice => (
        <div
          key={notice.id}
          className={`relative bg-white rounded-xl border p-5 ${
            notice.pinned ? 'border-blue-600/60 shadow-md shadow-blue-900/20' : 'border-slate-200'
          }`}
        >
          {notice.pinned && (
            <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-900/40 border border-blue-800 px-2 py-0.5 rounded-full">
              <Pin className="w-2.5 h-2.5" /> Pinned
            </span>
          )}
          <h3 className="font-semibold text-slate-900 pr-20">{notice.title}</h3>
          {notice.body && (
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{notice.body}</p>
          )}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-600">{formatDate(notice.created_at)}</span>
            <button
              onClick={() => shareOnWhatsApp(notice)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Share on WhatsApp
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
