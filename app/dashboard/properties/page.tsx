import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

async function getProperties() {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return []; // Empty state simulation
}

function PropertiesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function PropertiesContent() {
  const properties = await getProperties();

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border border-dashed rounded-xl border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
          <Home className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No properties yet — add your first one</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          Get started by adding your first residential or commercial property. You'll be able to manage leases, track maintenance, and collect rent all in one place.
        </p>
        <div className="flex items-center space-x-4">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Property
          </Button>
          <Button variant="outline" className="border-slate-300 dark:border-slate-700">
            Import Data
          </Button>
        </div>
      </div>
    );
  }

  // Real table would go here
  return <div>Table</div>;
}

export default function PropertiesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Property Portfolio</h1>
        </div>
        <Button className="bg-blue-700 hover:bg-blue-800 text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      <Suspense fallback={<PropertiesSkeleton />}>
        <PropertiesContent />
      </Suspense>
    </div>
  );
}
