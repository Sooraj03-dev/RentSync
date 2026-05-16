"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

const OTP_LENGTH = 6;

export default function VerifyPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();

  const focusNext = (index: number) => {
    inputRefs.current[index + 1]?.focus();
  };
  const focusPrev = (index: number) => {
    inputRefs.current[index - 1]?.focus();
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...digits];
    updated[index] = value.slice(-1);
    setDigits(updated);
    if (value && index < OTP_LENGTH - 1) focusNext(index);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) focusPrev(index);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const updated = [...digits];
    pasted.split("").forEach((char, i) => { updated[i] = char; });
    setDigits(updated);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const token = digits.join("");
    if (token.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError(null);

    const contact = sessionStorage.getItem("pending_contact") ?? "";
    const contactType = sessionStorage.getItem("contact_type") ?? "email";
    const role = sessionStorage.getItem("pending_role") ?? "tenant";

    const { data, error: verifyError } =
      contactType === "email"
        ? await supabase.auth.verifyOtp({ email: contact, token, type: "email" })
        : await supabase.auth.verifyOtp({ phone: contact, token, type: "sms" });

    if (verifyError || !data.user) {
      setError(verifyError?.message ?? "Invalid or expired code.");
      setLoading(false);
      return;
    }

    // Upsert user profile with role
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email ?? null,
      phone: data.user.phone ?? null,
      role,
      onboarded: false,
      updated_at: new Date().toISOString(),
    });

    sessionStorage.removeItem("pending_contact");
    sessionStorage.removeItem("pending_role");
    sessionStorage.removeItem("contact_type");

    router.push("/onboard");
  };

  const contact = typeof window !== "undefined"
    ? sessionStorage.getItem("pending_contact") ?? ""
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold text-sky-900 tracking-tight">RentSync</span>
        <Link href="/login" className="text-sm text-sky-700 hover:text-sky-900 transition-colors">
          Back to Login
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#0B4F6C] flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Enter Verification Code</h1>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-slate-700">{contact || "your contact"}</span>
          </p>
        </div>

        {/* OTP card */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col gap-6">
          {/* Digit inputs */}
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                id={`otp-digit-${i}`}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                className="w-11 h-14 text-center text-xl font-bold text-slate-800 border-2 border-slate-200 rounded-xl focus:border-[#0B4F6C] focus:outline-none focus:ring-2 focus:ring-[#0B4F6C]/20 transition-all bg-slate-50"
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}

          <button
            id="verify-otp-btn"
            onClick={handleVerify}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0B4F6C] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#083a52] transition-colors disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify & Continue"}
          </button>

          <button
            id="resend-otp-btn"
            type="button"
            className="text-xs text-slate-400 hover:text-[#0B4F6C] transition-colors text-center"
          >
            Didn&apos;t receive a code? <span className="font-semibold underline">Resend</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B3A52] text-white py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold">RentSync</p>
          <p className="text-xs text-blue-200">© 2024 RentSync India. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
