import { createClient } from '@/lib/supabase/server';
import { RentGrid } from '@/components/rent/RentGrid';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rent Management' };

export default async function DashboardRentPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: payments } = await supabase
    .from('rent_payments')
    .select(`
      id, tenancy_id, amount_paid, payment_date, month_year, status,
      tenancies!inner(unit_number, property_id, profiles(name), properties!inner(landlord_id))
    `)
    .eq('tenancies.properties.landlord_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rent Management</h1>
        <p className="text-slate-500 mt-1 text-sm">Track and manage all rent payments across your portfolio.</p>
      </div>
      <RentGrid rows={((payments ?? []) as unknown) as Parameters<typeof RentGrid>[0]['rows']} />
    </div>
  );
}
