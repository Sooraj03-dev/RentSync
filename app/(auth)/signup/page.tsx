"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
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

  // Simple password strength calculation
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
  const strengthColor = 
    strength <= 1 ? "bg-red-400" : 
    strength === 2 ? "bg-yellow-400" : 
    strength === 3 ? "bg-emerald-400" : "bg-blue-500";

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
      options: {
        data: { role },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      // Upsert profile
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
        // Logged in directly -> will be intercepted by middleware to go to /register
        router.push("/register");
      } else {
        setError("Please check your email to verify your account.");
        setLoading(false);
      }
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboard`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      
      {/* ── Left Side (Form) ── */}
      <div className="flex-1 flex flex-col px-6 md:px-12 lg:px-20 py-6 relative z-10">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="text-2xl font-bold text-[#0B4F6C] tracking-tight">
            RentSync
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
            
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Create your account</h1>
            <p className="text-sm text-slate-500 mb-8">Join the modern way of property management.</p>

            {/* Role Toggle */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => setRole("tenant")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  role === "tenant" ? "bg-white text-[#0B4F6C] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Tenant
              </button>
              <button
                type="button"
                onClick={() => setRole("landlord")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  role === "landlord" ? "bg-white text-[#0B4F6C] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Landlord
              </button>
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
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] transition-colors"
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
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] transition-colors pr-10"
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
                          className={`flex-1 rounded-full ${idx < strength ? strengthColor : "bg-slate-200"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 w-16 text-right">
                      {strengthLabels[strength]}
                    </span>
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
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B4F6C] focus:ring-1 focus:ring-[#0B4F6C] transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 text-xs px-3 py-2 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B4F6C] hover:bg-[#083a52] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center transition-colors disabled:opacity-70 mt-2 shadow-md shadow-[#0B4F6C]/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
              </button>

            </form>

            <div className="flex items-center gap-3 my-8">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Or register with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("apple")}
                disabled={loading}
                className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
                </svg>
                Apple
              </button>
            </div>

            <p className="text-center text-sm text-slate-500 mt-8">
              Already have an account? <Link href="/login" className="text-[#0B4F6C] font-bold hover:underline">Sign in</Link>
            </p>
          </div>

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
      <div className="hidden lg:flex flex-1 bg-[#DCE4F7] relative overflow-hidden items-center justify-center p-12">
        {/* Abstract circles */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border-[1px] border-blue-300/30"></div>
        <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] rounded-full border-[1px] border-blue-300/30"></div>
        
        <div className="max-w-md relative z-10">
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              </div>
              <div className="space-y-3 pt-1 flex-1">
                <div className="h-2.5 bg-blue-100 rounded-full w-3/4"></div>
                <div className="h-2 bg-blue-50 rounded-full w-1/2"></div>
                <div className="h-1.5 bg-slate-100 rounded-full w-full mt-4"></div>
                <div className="h-1.5 bg-slate-100 rounded-full w-5/6"></div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#2A4365] mb-4">Simplified Rentals</h2>
          <p className="text-[#4A5568] leading-relaxed">
            Join over 50,000 users managing properties and finding homes with absolute atmospheric clarity.
          </p>
        </div>
      </div>

    </div>
  );
}
