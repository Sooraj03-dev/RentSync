"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Home, Building2, MapPin, Hash, Building } from "lucide-react";
import Link from "next/link";

type Role = "landlord" | "tenant";

export default function OnboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  // Landlord state
  const [propName, setPropName] = useState("");
  const [address, setAddress] = useState("");
  const [units, setUnits] = useState(1);
  const [propType, setPropType] = useState("apartment");

  // Tenant state
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile?.role) {
        router.push("/register");
        return;
      }

      const userRole = profile.role as Role;
      setRole(userRole);

      // Check if already onboarded
      if (userRole === "landlord") {
        const { count } = await supabase.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", user.id);
        if (count && count > 0) {
          localStorage.setItem("rs_onboarded", "true");
          router.push("/dashboard");
          return;
        }
      } else {
        const { count } = await supabase.from("tenancies").select("*", { count: "exact", head: true }).eq("tenant_id", user.id);
        if (count && count > 0) {
          localStorage.setItem("rs_onboarded", "true");
          router.push("/tenant");
          return;
        }
      }

      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const handleLandlordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("properties").insert({
      owner_id: userId,
      name: propName,
      address,
      unit_count: units,
      property_type: propType
    });

    if (insertError) {
      setError(`Failed to create property: ${insertError.message}`);
      setSubmitting(false);
      return;
    }

    await supabase.from("profiles").update({ onboarded: true }).eq("id", userId);
    localStorage.setItem("rs_onboarded", "true");
    router.push("/dashboard");
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    setError(null);

    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      setError("Invite code must be exactly 8 characters.");
      setSubmitting(false);
      return;
    }

    const { data: tenancy, error: tenancyError } = await supabase
      .from("tenancies")
      .select("id, status")
      .eq("invite_code", code)
      .eq("status", "active")
      .single();

    if (tenancyError || !tenancy) {
      setError("Invalid or expired code. Check with your landlord.");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("tenancies")
      .update({ tenant_id: userId })
      .eq("id", tenancy.id);

    if (updateError) {
      setError("Failed to link property.");
      setSubmitting(false);
      return;
    }

    await supabase.from("profiles").update({ onboarded: true }).eq("id", userId);
    localStorage.setItem("rs_onboarded", "true");
    router.push("/tenant");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B4F6C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-md">
        
        {/* Back Link */}
        <Link href="/register" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 w-fit font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              <span>Step 2 of 2 — {role === "landlord" ? "Add your first property" : "Link to your property"}</span>
            </div>
            <div className="flex gap-2 h-1.5">
              <div className="flex-1 bg-slate-200 rounded-full" />
              <div className="flex-1 bg-[#0B4F6C] rounded-full" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {role === "landlord" ? (
            <form onSubmit={handleLandlordSubmit} className="flex flex-col gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Property Name</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 bg-white focus-within:border-[#0B4F6C] focus-within:ring-1 focus-within:ring-[#0B4F6C] transition-colors">
                  <Building className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    placeholder="e.g. Green Valley Apartments"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Full Address</label>
                <div className="flex items-start gap-2 border border-slate-200 rounded-xl px-4 py-3 bg-white focus-within:border-[#0B4F6C] focus-within:ring-1 focus-within:ring-[#0B4F6C] transition-colors">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Building, Street, Area, City, PIN"
                    rows={2}
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Total Units</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={units}
                    onChange={(e) => setUnits(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Type</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] transition-colors appearance-none"
                  >
                    <option value="apartment">Apartment Building</option>
                    <option value="pg">PG</option>
                    <option value="independent">Independent House</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-[#0B4F6C] hover:bg-[#083a52] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-[#0B4F6C]/20"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting ? "Saving..." : "Add property & go to dashboard →"}
              </button>

              <div className="text-center mt-2">
                <Link href="/dashboard" className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
                  Set up later →
                </Link>
              </div>

            </form>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Option A */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Option A: I have an invite code</h3>
                <form onSubmit={handleTenantSubmit} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 bg-white focus-within:border-[#0B4F6C] focus-within:ring-1 focus-within:ring-[#0B4F6C] transition-colors">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD34"
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none uppercase tracking-widest font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || inviteCode.length !== 8}
                    className="w-full bg-[#0B4F6C] hover:bg-[#083a52] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center transition-colors disabled:opacity-50 shadow-md shadow-[#0B4F6C]/20"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
                  </button>
                </form>
              </div>

              {/* Option B */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Option B: No invite code yet?</h3>
                <p className="text-xs text-slate-500 mb-4">You can link your tenancy later from Settings.</p>
                <Link 
                  href="/tenant" 
                  className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors text-center"
                >
                  Go to dashboard anyway →
                </Link>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
