"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { useState } from "react";

export function InstallPrompt() {
  const { promptEvent, promptToInstall } = useInstallPrompt();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const shouldShow = pathname?.startsWith("/dashboard") || pathname?.startsWith("/tenant");

  if (!shouldShow || !promptEvent || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-slate-900 dark:bg-slate-800 text-slate-100 p-4 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between z-50 animate-in slide-in-from-bottom-10 duration-300">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Install RentSync</h3>
          <p className="text-xs text-slate-400">Access your dashboard faster</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={promptToInstall} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0 h-8 text-xs px-3">
          Install Now
        </Button>
        <button onClick={() => setDismissed(true)} className="p-1 hover:bg-slate-700 dark:hover:bg-slate-700 rounded-md transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
