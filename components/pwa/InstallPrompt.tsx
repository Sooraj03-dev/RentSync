'use client';

import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

export function InstallPrompt() {
  const { isInstallable, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 shadow-2xl text-sm text-slate-800">
      <Download className="w-4 h-4 text-blue-400 shrink-0" />
      <span>Install RentSync as an app</span>
      <button
        onClick={install}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold text-xs transition-colors"
      >
        Install
      </button>
      <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
