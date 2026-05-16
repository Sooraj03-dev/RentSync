import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Wallet, Wrench, Bell } from "lucide-react";

async function getMetrics() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    totalProperties: 0,
    rentCollected: 0,
    openTickets: 0,
    recentNotices: "—"
  };
}

function MetricCardsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

async function MetricCards() {
  const metrics = await getMetrics();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500">Total Properties</CardTitle>
          <Building className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metrics.totalProperties}</div>
          <p className="text-xs text-slate-500">Active portfolio</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500">Rent Collected</CardTitle>
          <Wallet className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{metrics.rentCollected}</div>
          <p className="text-xs text-slate-500">This month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500">Open Tickets</CardTitle>
          <Wrench className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metrics.openTickets}</div>
          <p className="text-xs text-slate-500">Needs attention</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500">Recent Notices</CardTitle>
          <Bell className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metrics.recentNotices}</div>
          <p className="text-xs text-slate-500">Unread notifications</p>
        </CardContent>
      </Card>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Portfolio Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time performance of your rental ecosystem.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<MetricCardsSkeleton />}>
          <MetricCards />
        </Suspense>
      </div>
    </div>
  );
}
