"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Receipt, Settings, HelpCircle } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Properties", href: "/dashboard/properties", icon: Building2 },
    { name: "Tenants", href: "/dashboard/tenants", icon: Users },
    { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 pt-8 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#0a415c] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-[#0a415c] text-[17px] leading-tight tracking-tight">RentSync Admin</h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-0.5">Property Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1.5">
          {navItems.map((item) => {
            // Active if exact match or subpath
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-8 py-3.5 text-[14px] font-bold transition-colors relative ${
                  isActive 
                    ? "bg-[#f4f7f9] text-[#0a415c]" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#0a415c] rounded-l-full"></div>
                )}
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-[#0a415c]" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-8 pb-10 border-t border-slate-100">
          <Link
            href="/support"
            className="flex items-center gap-4 text-[14px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <HelpCircle className="w-[18px] h-[18px] text-slate-500" />
            Support
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
