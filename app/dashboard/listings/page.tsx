import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ListingsManager from './ListingsManager';

export const metadata = { title: 'Listings' };

export default async function DashboardListingsPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', session.user.id);

  const propertyIds = properties?.map(p => p.id) || [];

  let units: any[] = [];
  if (propertyIds.length > 0) {
    const { data: tenancies } = await supabase
      .from('tenancies')
      .select('id, unit_number, rent_amount, status, property_id, properties(*)')
      .in('property_id', propertyIds);
    units = tenancies || [];
  }

  // Get current listings for these properties
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .in('property_id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000']);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
        <p className="text-slate-500 mt-1 text-sm">Mark units as vacant to make them appear on the public interactive map.</p>
      </div>
      <ListingsManager units={units} initialListings={listings || []} />
    </div>
  );
}
