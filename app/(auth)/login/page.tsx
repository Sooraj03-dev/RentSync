"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Hash,
} from "lucide-react";
import Link from "next/link";

type Role = "landlord" | "tenant";
type LoginMode = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<Role>("landlord");
  const [mode, setMode] = useState<LoginMode>("password");

  // Password login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP login state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Password Sign In ──
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      router.push("/register");
    }
  };

  // ── OTP: Send Code ──
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: {
        shouldCreateUser: false,
        data: { role },
      },
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
    } else {
      setOtpSent(true);
      setSuccessMsg(`A 6-digit code has been sent to ${otpEmail}. Check your inbox!`);
    }
  };

  // ── OTP: Verify Code ──
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: token.trim(),
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      setError("Invalid or expired code. Please try again.");
    } else {
      router.push("/register");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/register` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">RentSync</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          ← Back to Home
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your RentSync account</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-7 flex flex-col gap-5">

            {/* Role Selector */}
            <div className="grid grid-cols-2 gap-2">
              {(["landlord", "tenant"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold uppercase tracking-widest transition-all ${
                    role === r
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-900/20"
                      : "border-slate-200 text-slate-500 hover:border-blue-500/50 hover:text-slate-800"
                  }`}
                >
                  {r === "landlord" ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {r}
                </button>
              ))}
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-50/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setMode("password"); setError(null); setSuccessMsg(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "password" ? "bg-white text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Password
              </button>
              <button
                type="button"
                onClick={() => { setMode("otp"); setError(null); setSuccessMsg(null); setOtpSent(false); setToken(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "otp" ? "bg-white text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                One-Time Code
              </button>
            </div>

            {/* ── Password Mode ── */}
            {mode === "password" && (
              <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-3 py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-md shadow-blue-900/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* ── OTP Mode ── */}
            {mode === "otp" && !otpSent && (
              <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500">We'll send a 6-digit code to your inbox.</p>

                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-3 py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-md shadow-blue-900/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Code <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {mode === "otp" && otpSent && (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                {successMsg && (
                  <div className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-xl px-3 py-2.5">
                    {successMsg}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 123456"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.5em] text-slate-900 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-3 py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || token.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-md shadow-blue-900/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setToken(""); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors text-center"
                >
                  ← Use a different email
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Or</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            New to RentSync?{" "}
            <Link href="/signup" className="text-blue-400 font-bold hover:text-blue-300 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 bg-slate-100 text-center border-t border-slate-300">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-slate-500">RentSync · © 2024 All rights reserved.</p>
          <nav className="flex gap-5 text-xs text-slate-500">
            <Link href="#" className="hover:text-slate-800 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-800 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-800 transition-colors">Support</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
