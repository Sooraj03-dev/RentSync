"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ContactRound,
} from "lucide-react";
import Link from "next/link";

type Role = "landlord" | "tenant";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("landlord");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Determine if input is email or phone
    const isEmail = contact.includes("@");

    const { error: otpError } = isEmail
      ? await supabase.auth.signInWithOtp({
          email: contact,
          options: { data: { role } },
        })
      : await supabase.auth.signInWithOtp({
          phone: contact,
          options: { data: { role } },
        });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
    } else {
      sessionStorage.setItem("pending_role", role);
      sessionStorage.setItem("pending_contact", contact);
      sessionStorage.setItem("contact_type", isEmail ? "email" : "phone");
      router.push("/verify");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-white flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold text-sky-900 tracking-tight">
          RentSync
        </span>
        <Link
          href="/"
          className="text-sm text-sky-700 hover:text-sky-900 transition-colors"
        >
          Back to Home
        </Link>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        {/* Logo block */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#0B4F6C] flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">RentSync</h1>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            Manage your property and rentals with ease.
          </p>
        </div>

        {/* ── Card ── */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex flex-col gap-5">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2">
            {(["landlord", "tenant"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold uppercase tracking-widest transition-all ${
                  role === r
                    ? "border-[#0B4F6C] bg-[#0B4F6C] text-white"
                    : "border-slate-200 text-slate-500 hover:border-[#0B4F6C]/40"
                }`}
              >
                {r === "landlord" ? (
                  <Building2 className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                {r}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1.5">
                Enter Mobile or Email
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#0B4F6C]/30 bg-slate-50">
                <ContactRound className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="contact-input"
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g., +91 98765 43210"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-[#0B4F6C] font-medium hover:underline w-fit"
            >
              <Sparkles className="w-3 h-3" />
              Sign in using a Magic Link
            </button>

            <p className="text-xs text-slate-400">Having trouble signing in?</p>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              id="send-otp-btn"
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0B4F6C] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#083a52] transition-colors disabled:opacity-60"
            >
              {loading ? "Sending…" : "Get Verification Code"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Security badge */}
            <div className="flex items-center gap-2 justify-center pt-1">
              <div className="h-px flex-1 bg-slate-100" />
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure Encryption System
              </div>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
          </form>
        </div>

        {/* Social auth */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Or Sign In With
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="google-signin-btn"
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Account
            </button>
            <button
              id="apple-signin-btn"
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
              </svg>
              Apple ID
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Need an account?{" "}
          <Link
            href="/register"
            className="text-[#0B4F6C] font-semibold hover:underline"
          >
            Join RentSync today
          </Link>
        </p>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0B3A52] text-white py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">RentSync</p>
            <p className="text-xs text-blue-200">
              © 2024 RentSync India. All rights reserved.
            </p>
          </div>
          <nav className="flex gap-5 text-xs text-blue-200">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-white transition-colors">
              Contact Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
