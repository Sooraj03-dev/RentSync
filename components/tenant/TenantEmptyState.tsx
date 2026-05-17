'use client';

import { useState } from 'react';
import { Key } from 'lucide-react';
import { CodeEntryModal } from '@/components/invites/CodeEntryModal';
import { useRouter } from 'next/navigation';

export function TenantEmptyState() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex-1 bg-gray-50 min-h-screen flex items-center justify-center p-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Key className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">You haven't joined a property yet</h2>
        <p className="text-slate-500 text-sm mt-2">Ask your landlord for an invite code to get started.</p>
        <button
          onClick={() => setOpen(true)}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors"
        >
          <Key className="w-4 h-4" />
          Enter invite code →
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <CodeEntryModal
              onClose={() => setOpen(false)}
              onSuccess={() => { setOpen(false); router.refresh(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
