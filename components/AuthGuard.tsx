"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mock session check
    const checkSession = async () => {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      // Assume user is authenticated
      setLoading(false);
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-100">
        <div className="flex flex-col space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-50"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-50"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
