"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, Home, Upload, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? user.phone ?? "Unknown");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();

      if (profile?.name) {
        router.push(profile.role === "landlord" ? "/dashboard" : "/tenant");
        return;
      }

      setRole(profile?.role as "landlord" | "tenant" | null);
      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      val = "+91 " + val.replace("+91", "").trim();
    }
    // Allow only numbers and spaces after +91
    const stripped = val.slice(4).replace(/\D/g, "");
    setPhone(`+91 ${stripped}`.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const phoneDigits = phone.slice(4).replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      setError("Phone number must be exactly 10 digits after +91.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let avatar_url = null;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        // If bucket missing, just skip the avatar — don't block the user
        console.warn("Avatar upload skipped:", uploadError.message);
      } else {
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatar_url = data.publicUrl;
      }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ name, phone, avatar_url })
      .eq("id", userId);

    if (updateError) {
      setError(`Failed to save profile: ${updateError.message}`);
      setSubmitting(false);
      return;
    }

    router.push("/onboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B4F6C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8 font-sans">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0B4F6C] flex items-center justify-center font-bold text-white text-xl shadow-lg">
            RS
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RentSync</h1>
            <p className="text-sm text-slate-500 mt-1">Complete your profile to continue</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              <span>Step 1 of 2 — Your details</span>
            </div>
            <div className="flex gap-2 h-1.5">
              <div className="flex-1 bg-[#0B4F6C] rounded-full" />
              <div className="flex-1 bg-slate-100 rounded-full" />
            </div>
          </div>

          {/* Role Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Account Type</span>
              {role === "landlord" ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" /> Landlord
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                  <Home className="w-3.5 h-3.5" /> Tenant
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Signed in as <strong className="text-slate-700 font-semibold">{email}</strong>. Wrong role? Sign out and try again.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Avatar Upload */}
            <div className="flex items-center gap-5">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-200 border-dashed flex items-center justify-center cursor-pointer hover:border-[#0B4F6C]/50 hover:bg-sky-50 overflow-hidden shrink-0 group relative transition-colors"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#0B4F6C] transition-colors" />
                )}
                {avatarPreview && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700">Profile Photo</label>
                <p className="text-xs text-slate-500 mt-1">Optional. PNG or JPG.</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl border border-red-100 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || name.trim() === ""}
              className="w-full mt-2 bg-[#0B4F6C] hover:bg-[#083a52] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-[#0B4F6C]/20"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {submitting ? "Saving..." : "Save & continue →"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
