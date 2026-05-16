import { WifiOff, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex flex-col items-center justify-center px-4 text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
        <WifiOff className="w-10 h-10 text-slate-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-800">You&apos;re Offline</h1>
        <p className="text-sm text-slate-500 max-w-xs">
          No internet connection. Some features are unavailable, but your cached
          rent status is shown below.
        </p>
      </div>

      {/* Cached rent status card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">
          Last Known Rent Status
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700 font-medium">May 2024</span>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            Paid
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Data cached when you last had a connection.
        </p>
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-[#0B4F6C] font-semibold hover:underline"
      >
        <Home className="w-4 h-4" />
        Go to Home
      </Link>
    </div>
  );
}
