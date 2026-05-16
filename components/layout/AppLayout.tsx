"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <InstallPrompt />
    </AuthGuard>
  );
}
