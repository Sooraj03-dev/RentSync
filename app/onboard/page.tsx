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
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md">
        
        {/* Back Link */}
        <Link href="/register" className="flex items-center gap-1.5 text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors mb-6 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Card */}
        <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-6 shadow-xl">
          
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
              <span>Step 2 of 2 — {role === "landlord" ? "Add your first property" : "Link to your property"}</span>
            </div>
            <div className="flex gap-2 h-1.5">
              <div className="flex-1 bg-[#6366F1] rounded-full" />
              <div className="flex-1 bg-[#6366F1] rounded-full" />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {role === "landlord" ? (
            <form onSubmit={handleLandlordSubmit} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1.5">Property Name</label>
                <div className="flex items-center gap-2 border border-[#30363D] rounded-lg px-3 py-2.5 bg-[#0D1117] focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-colors">
                  <Building className="w-4 h-4 text-[#8B949E]" />
                  <input
                    type="text"
                    required
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    placeholder="e.g. Green Valley Apartments"
                    className="flex-1 bg-transparent text-sm text-[#E6EDF3] placeholder-[#8B949E] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1.5">Full Address</label>
                <div className="flex items-start gap-2 border border-[#30363D] rounded-lg px-3 py-2.5 bg-[#0D1117] focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-colors">
                  <MapPin className="w-4 h-4 text-[#8B949E] mt-0.5" />
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Building, Street, Area, City, PIN"
                    rows={2}
                    className="flex-1 bg-transparent text-sm text-[#E6EDF3] placeholder-[#8B949E] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-1.5">Total Units</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={units}
                    onChange={(e) => setUnits(Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-1.5">Type</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2.5 text-sm text-[#E6EDF3] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors appearance-none"
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
                className="w-full mt-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Saving..." : "Add property & go to dashboard →"}
              </button>

              <div className="text-center mt-2">
                <Link href="/dashboard" className="text-xs text-[#8B949E] hover:text-[#E6EDF3] transition-colors">
                  Set up later →
                </Link>
              </div>

            </form>
          ) : (
            <div className="flex flex-col gap-5">
              
              {/* Option A */}
              <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[#E6EDF3] mb-3">Option A: I have an invite code</h3>
                <form onSubmit={handleTenantSubmit} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 border border-[#30363D] rounded-lg px-3 py-2 bg-[#161B22] focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-colors">
                    <Hash className="w-4 h-4 text-[#8B949E]" />
                    <input
                      type="text"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD34"
                      className="flex-1 bg-transparent text-sm text-[#E6EDF3] placeholder-[#8B949E] outline-none uppercase tracking-widest font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || inviteCode.length !== 8}
                    className="w-full bg-[#30363D] hover:bg-[#4F46E5] text-white font-semibold py-2 rounded-lg text-sm flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
                  </button>
                </form>
              </div>

              {/* Option B */}
              <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4 flex flex-col items-center text-center">
                <h3 className="text-sm font-semibold text-[#E6EDF3] mb-1">Option B: No invite code yet?</h3>
                <p className="text-[11px] text-[#8B949E] mb-3">You can link your tenancy later from Settings.</p>
                <Link 
                  href="/tenant" 
                  className="w-full bg-[#161B22] border border-[#30363D] hover:border-[#8B949E] text-[#E6EDF3] font-semibold py-2 rounded-lg text-sm transition-colors text-center"
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
