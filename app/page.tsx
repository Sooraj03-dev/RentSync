import Link from "next/link";
import { ShieldCheck, ArrowRight, Shield, Headset, CreditCard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 max-w-7xl mx-auto w-full bg-white">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0B4F6C]" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">RentSync</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Properties</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Payments</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Maintenance</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Help</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm font-semibold bg-[#0B4F6C] text-white px-5 py-2.5 rounded-lg hover:bg-[#083a52] transition-colors">
            List Property
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero Section ── */}
        <section className="bg-[#EEF7FF] py-20 px-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold text-[#0B2136] leading-[1.1] tracking-tight">
                Find Your Perfect Home with Ease.
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Simple, high-contrast, and easy-to-read property listings designed for clarity. Discover a renting experience that prioritizes your comfort and security.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <Link href="/signup" className="bg-[#38bdf8] text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-[#0ea5e9] transition-colors">
                  Get Started
                </Link>
                <Link href="#" className="bg-white text-slate-700 px-6 py-3 rounded-lg font-semibold border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-[#93b8d4] rounded-[2rem] transform translate-x-4 translate-y-4"></div>
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80" 
                alt="Modern Living Room" 
                className="relative z-10 rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </section>

        {/* ── Explore Section ── */}
        <section className="py-20 px-8 bg-white max-w-7xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-[#0B2136] mb-4">Explore Local Listings</h2>
          <p className="text-slate-500 mb-10">Browse available homes in your preferred neighborhood with our intuitive map interface.</p>
          
          <div className="w-full h-[400px] bg-slate-100 rounded-2xl relative overflow-hidden flex items-center justify-center">
            {/* Mock Map Background */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")' }}></div>
            
            {/* Map UI Elements */}
            <div className="absolute top-6 left-6 bg-white p-3 rounded-xl shadow-md border border-slate-100 flex items-center gap-2 text-sm w-64 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Search neighborhoods...
            </div>

            {/* Price Tags */}
            <div className="absolute top-20 left-1/3 bg-[#0B4F6C] text-white px-4 py-2 rounded-full font-bold shadow-lg transform -translate-x-1/2 before:content-[''] before:absolute before:bottom-[-6px] before:left-1/2 before:-translate-x-1/2 before:w-3 before:h-3 before:bg-[#0B4F6C] before:rotate-45">
              ₹45,000
            </div>
            <div className="absolute top-1/2 left-1/2 bg-[#0B4F6C] text-white px-4 py-2 rounded-full font-bold shadow-lg transform -translate-x-1/2 before:content-[''] before:absolute before:bottom-[-6px] before:left-1/2 before:-translate-x-1/2 before:w-3 before:h-3 before:bg-[#0B4F6C] before:rotate-45">
              ₹38,000
            </div>
            <div className="absolute bottom-32 right-1/4 bg-[#0B4F6C] text-white px-4 py-2 rounded-full font-bold shadow-lg transform -translate-x-1/2 before:content-[''] before:absolute before:bottom-[-6px] before:left-1/2 before:-translate-x-1/2 before:w-3 before:h-3 before:bg-[#0B4F6C] before:rotate-45">
              ₹52,000
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section className="bg-[#FAF9FF] py-20 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Verified Safety</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Every property listing undergoes a multi-step verification process to ensure your security and peace of mind.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Headset className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">24/7 Support</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Our dedicated concierge team is available around the clock to assist with any maintenance or lease inquiries.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Easy Payments</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Automated rent collection and digital receipts via our secure, high-contrast payment gateway dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="py-20 px-8 bg-white max-w-7xl mx-auto w-full">
          <div className="bg-[#0B4F6C] rounded-3xl p-12 flex flex-col items-center text-center text-white gap-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to upgrade your living?</h2>
            <p className="text-blue-100 max-w-xl">
              Join thousands of happy tenants and landlords who use RentSync for a more transparent rental experience.
            </p>
            <Link href="/signup" className="mt-4 bg-white text-[#0B4F6C] px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-colors">
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold text-[#0B4F6C]">RentSync</span>
            </div>
            <p className="text-xs text-slate-400">© 2024 RentSync. All rights reserved.</p>
          </div>
          <nav className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="#" className="hover:text-slate-900">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-900">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-900">Contact Us</Link>
            <Link href="#" className="hover:text-slate-900">Careers</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
