"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { 
  LayoutDashboard, Building, Wallet, Wrench, 
  Bell, Receipt, Map, Home, FileText, PlusCircle, Settings, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const role = useStore((state) => state.role);

  const landlordLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Properties", href: "/dashboard/properties", icon: Building },
    { name: "Rent", href: "/dashboard/rent", icon: Wallet },
    { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
    { name: "Notices", href: "/dashboard/notices", icon: Bell },
    { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    { name: "Listings", href: "/dashboard/listings", icon: Map },
  ];

  const tenantLinks = [
    { name: "Overview", href: "/tenant", icon: Home },
    { name: "Rent", href: "/tenant/rent", icon: Wallet },
    { name: "Maintenance", href: "/tenant/maintenance", icon: Wrench },
    { name: "Documents", href: "/tenant/documents", icon: FileText },
    { name: "Notices", href: "/tenant/notices", icon: Bell },
  ];

  const links = role === "landlord" ? landlordLinks : tenantLinks;

  return (
    <aside className="flex flex-col w-64 h-screen border-r bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-800">
        <Building className="w-6 h-6 text-blue-600 mr-2" />
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">RentSync</span>
      </div>
      <div className="flex flex-col flex-grow py-4">
        <nav className="flex-1 px-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                  isActive 
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100" 
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        {role === 'landlord' && (
          <div className="px-4 mt-8 mb-4">
             <Link href="/dashboard/properties">
              <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Property
              </button>
             </Link>
          </div>
        )}

        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <Link href="/settings" className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
          <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
