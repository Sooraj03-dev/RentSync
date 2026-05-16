import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('listings')
    .select('id, property_id, unit_number, rent_amount, lat, lng, amenities, photos, contact_wa')
    .eq('is_available', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const features = (data || []).map((listing: any) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [listing.lng, listing.lat],
    },
    properties: {
      id: listing.id,
      property_id: listing.property_id,
      unit_number: listing.unit_number,
      rent_amount: listing.rent_amount,
      amenities: listing.amenities,
      photos: listing.photos,
      contact_wa: listing.contact_wa,
    },
  }));

  const geoJson = {
    type: 'FeatureCollection',
    features,
  };

  return NextResponse.json(geoJson);
}
