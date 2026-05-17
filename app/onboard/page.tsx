"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CodeEntryModal } from "@/components/invites/CodeEntryModal";
import { useStore } from "@/lib/store";

type Role = "landlord" | "tenant";

export default function OnboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { setActiveTenancy } = useStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (!profile?.role) { router.push("/register"); return; }

      const userRole = profile.role as Role;
      setRole(userRole);

      if (userRole === "landlord") {
        const { count } = await supabase.from("properties")
          .select("*", { count: "exact", head: true }).eq("owner_id", user.id);
        if (count && count > 0) { router.push("/dashboard"); return; }
      } else {
        // Check sessionStorage for pending invite (post-login resume)
        const pendingId = sessionStorage.getItem("rentsync_pending_invite");
        if (pendingId) {
          // Will be handled by CodeEntryModal which reads the step
        }
        const { data: tenancy } = await supabase.from("tenancies")
          .select("id").eq("tenant_id", user.id).eq("status", "active").maybeSingle();
        if (tenancy) { setActiveTenancy(tenancy.id); router.push("/tenant"); return; }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSkip = async (target: string) => {
    if (!userId) return;
    setSubmitting(true);
    await supabase.from("profiles").update({ onboarded: true }).eq("id", userId);
    router.push(target);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── TENANT PATH ──────────────────────────────────────────────────────────────
  if (role === "tenant") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Step 2 of 2 — Link to your property
              </p>
              <div className="flex gap-2 h-1.5">
                <div className="flex-1 bg-slate-200 rounded-full" />
                <div className="flex-1 bg-blue-600 rounded-full" />
              </div>
            </div>
            <CodeEntryModal onSuccess={() => router.push("/tenant")} />
            <div className="text-center mt-4 border-t border-slate-100 pt-4">
              <button onClick={() => handleSkip("/tenant")} disabled={submitting}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Set up later →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LANDLORD PATH ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link href="/register" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 w-fit font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
          <div className="mb-8">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Step 2 of 2 — Add your first property
            </p>
            <div className="flex gap-2 h-1.5">
              <div className="flex-1 bg-slate-200 rounded-full" />
              <div className="flex-1 bg-blue-600 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col gap-5 text-center">
            <p className="text-sm text-slate-500">
              Set up your first property profile to access the landlord dashboard.
            </p>
            <Link href="/dashboard/properties/new"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">
              Continue to Property Setup →
            </Link>
            <button onClick={() => handleSkip("/dashboard")} disabled={submitting}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50">
              Set up later →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
