"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, User } from "lucide-react";
import Link from "next/link";

type Role = "tenant" | "landlord";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<Role>("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Password strength
  const getStrength = () => {
    let score = 0;
    if (password.length > 5) score += 1;
    if (password.length > 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  };

  const strength = getStrength();
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-400", "bg-red-400", "bg-yellow-400", "bg-emerald-400", "bg-blue-500"];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Upsert profile with role
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email ?? null,
        role,
        onboarded: false,
        updated_at: new Date().toISOString(),
      });
    }

    if (data.session) {
      // Immediately logged in — go to registration / onboarding
      router.push("/register");
    } else {
      // Email confirmation required
      setInfo(`Check your inbox at ${email} to confirm your account. Then sign in as a ${role}.`);
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const accentColor = role === "landlord" ? "blue" : "emerald";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

      {/* ── Left Side (Form) ── */}
      <div className="flex-1 flex flex-col px-6 md:px-12 lg:px-20 py-8 bg-white">

        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tight">
            RentSync
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </header>

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create your account</h1>
          <p className="text-sm text-slate-500 mb-8">Join the modern way of property management.</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {(["tenant", "landlord"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                  role === r
                    ? r === "landlord"
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-200"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {r === "landlord" ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                {r === "landlord" ? "I'm a Landlord" : "I'm a Tenant"}
              </button>
            ))}
          </div>

          {/* Role hint */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium mb-6 ${
            role === "landlord"
              ? "bg-blue-50 text-blue-700 border border-blue-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {role === "landlord"
              ? <><Building2 className="w-3.5 h-3.5 shrink-0" /> You'll get access to the <strong>Property Dashboard</strong></>
              : <><User className="w-3.5 h-3.5 shrink-0" /> You'll get access to the <strong>Tenant Portal</strong></>
            }
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength */}
              {password && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 flex gap-1 h-1.5">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all ${idx < strength ? strengthColors[strength] : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 w-16 text-right">{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2.5 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {info && (
              <div className="bg-emerald-50 text-emerald-700 text-xs px-3 py-2.5 rounded-xl border border-emerald-200">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-3.5 rounded-xl flex items-center justify-center transition-colors disabled:opacity-70 mt-2 shadow-md ${
                role === "landlord"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Create ${role === "landlord" ? "Landlord" : "Tenant"} Account`}
            </button>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Or sign up with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-slate-500 mt-7">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign in</Link>
          </p>

          <div className="text-center mt-8 text-xs text-slate-400">
            <div className="flex justify-center gap-4 mb-2">
              <Link href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            </div>
            <p>© 2024 RentSync. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* ── Right Side (Decoration) ── */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 to-slate-100 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border border-blue-200/50" />
        <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] rounded-full border border-blue-200/50" />

        <div className="max-w-md relative z-10">
          {/* Mock card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="h-3 bg-blue-100 rounded-full w-28 mb-1.5" />
                <div className="h-2 bg-slate-100 rounded-full w-20" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {["₹18,000", "₹15,000", "₹8,000"].map((amt, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Unit {i + 1}</div>
                  <div className="text-sm font-bold text-slate-800">{amt}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Paid ✓</div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            {role === "landlord" ? "Manage your portfolio" : "Find your perfect home"}
          </h2>
          <p className="text-slate-500 leading-relaxed">
            {role === "landlord"
              ? "Track rent, maintenance, expenses and documents across all your properties in one place."
              : "View rent history, raise maintenance requests, and communicate with your landlord — all in one app."}
          </p>
        </div>
      </div>
    </div>
  );
}
