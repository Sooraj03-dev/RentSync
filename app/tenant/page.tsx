import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Wrench, Bell, CheckCircle2 } from "lucide-react";

async function getTenantData() {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    rentStatus: { status: "Paid", amount: 0 },
    openTickets: 0,
    pinnedNotice: null
  };
}

function TenantSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

async function TenantContent() {
  const data = await getTenantData();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Rent Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500">Rent Status</CardTitle>
          <Wallet className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{data.rentStatus.status}</span>
          </div>
          <p className="text-xs text-slate-500">This month's rent is settled.</p>
        </CardContent>
      </Card>

      {/* Open Tickets Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500">Open Tickets</CardTitle>
          <Wrench className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          {data.openTickets === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-2">
              <span className="text-slate-500 mb-2">No active maintenance issues.</span>
              <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">All Clear</Badge>
            </div>
          ) : (
             <div className="text-2xl font-bold">{data.openTickets}</div>
          )}
        </CardContent>
      </Card>

      {/* Pinned Notice Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500">Pinned Notice</CardTitle>
          <Bell className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          {!data.pinnedNotice ? (
            <div className="flex flex-col items-center justify-center text-center py-2">
              <span className="text-slate-500 text-sm">No new announcements from your landlord.</span>
            </div>
          ) : (
            <div>{data.pinnedNotice}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TenantPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome Home</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here is an overview of your tenancy.</p>
      </div>

      <Suspense fallback={<TenantSkeleton />}>
        <TenantContent />
      </Suspense>
    </div>
  );
}
