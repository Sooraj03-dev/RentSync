"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, User, Loader2, Home, Hash } from "lucide-react";

type Role = "landlord" | "tenant";

export default function OnboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Landlord state
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [units, setUnits] = useState<number>(1);

  // Tenant state
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role) setRole(profile.role as Role);
    })();
  }, []);

  const handleLandlordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: propError } = await supabase.from("properties").insert({
      owner_id: user.id,
      name: propertyName,
      address,
      unit_count: units,
    });

    if (propError) { setError(propError.message); setLoading(false); return; }

    await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    router.push("/dashboard");
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Lookup tenancy by invite code
    const { data: tenancy, error: tenancyError } = await supabase
      .from("tenancies")
      .select("id")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .single();

    if (tenancyError || !tenancy) {
      setError("Invalid invite code. Please check with your landlord.");
      setLoading(false);
      return;
    }

    await supabase.from("tenancies").update({ tenant_id: user.id }).eq("id", tenancy.id);
    await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    router.push("/tenant");
  };

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B4F6C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-100 p-8">
        {/* Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#0B4F6C] flex items-center justify-center">
            {role === "landlord" ? (
              <Building2 className="w-6 h-6 text-white" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {role === "landlord" ? "Add Your First Property" : "Join a Property"}
            </h1>
            <p className="text-xs text-slate-500">
              {role === "landlord"
                ? "Set up your portfolio to get started"
                : "Enter the invite code from your landlord"}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {role === "landlord" ? (
          <form onSubmit={handleLandlordSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Property Name</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#0B4F6C]/30 bg-slate-50">
                <Home className="w-4 h-4 text-slate-400" />
                <input
                  id="property-name-input"
                  type="text"
                  required
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g., Sunshine Apartments"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
              <textarea
                id="property-address-input"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full property address"
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#0B4F6C]/30 bg-slate-50 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Units</label>
              <input
                id="unit-count-input"
                type="number"
                min={1}
                required
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#0B4F6C]/30 bg-slate-50"
              />
            </div>
            <button
              id="landlord-submit-btn"
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0B4F6C] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#083a52] transition-colors disabled:opacity-60 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving…" : "Create Property & Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTenantSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Invite Code</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#0B4F6C]/30 bg-slate-50">
                <Hash className="w-4 h-4 text-slate-400" />
                <input
                  id="invite-code-input"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., FLAT-A203"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-mono tracking-widest"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ask your landlord for the invite code for your unit.
              </p>
            </div>
            <button
              id="tenant-submit-btn"
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0B4F6C] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#083a52] transition-colors disabled:opacity-60 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Joining…" : "Join Property"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
