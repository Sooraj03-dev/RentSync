import useSWR from 'swr';
import { useMemo, useState } from 'react';

export interface Listing {
  id: string;
  property_id: string | null;
  unit_number: string;
  rent_amount: number;
  lat: number;
  lng: number;
  amenities: {
    wifi?: boolean;
    ac?: boolean;
    parking?: boolean;
    meals?: boolean;
    laundry?: boolean;
  };
  photos: string[];
  contact_wa: string | null;
  description: string | null;
  property_type: 'pg' | 'flat' | 'villa' | 'studio' | null;
  locality: string | null;
  is_available: boolean;
  created_at: string;
}

// Demo listings shown as fallback when DB has no listings yet
const DEMO_LISTINGS: Listing[] = [
  { id: 'demo-1', property_id: null, unit_number: 'Koramangala PG Room', rent_amount: 9500, lat: 12.9352, lng: 77.6245, amenities: { wifi: true, meals: true, laundry: true }, photos: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543210', description: 'Spacious PG room with home-cooked meals in the heart of Koramangala', property_type: 'pg', locality: 'Koramangala', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-2', property_id: null, unit_number: 'Indiranagar 1BHK Flat', rent_amount: 24000, lat: 12.9784, lng: 77.6408, amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543211', description: 'Modern 1BHK with AC and covered parking near 100 Feet Road', property_type: 'flat', locality: 'Indiranagar', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-3', property_id: null, unit_number: 'HSR Layout PG Room', rent_amount: 10500, lat: 12.9116, lng: 77.6389, amenities: { wifi: true, laundry: true }, photos: ['https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543212', description: 'Clean PG room in HSR Layout Sector 2 near tech parks', property_type: 'pg', locality: 'HSR Layout', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-4', property_id: null, unit_number: 'Whitefield Studio Flat', rent_amount: 18000, lat: 12.9698, lng: 77.7499, amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543213', description: 'Studio apartment near ITPL, fully furnished with AC', property_type: 'studio', locality: 'Whitefield', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-5', property_id: null, unit_number: 'Jayanagar 2BHK Flat', rent_amount: 28000, lat: 12.9299, lng: 77.5826, amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543214', description: 'Spacious 2BHK in premium Jayanagar 4th Block', property_type: 'flat', locality: 'Jayanagar', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-6', property_id: null, unit_number: 'BTM Layout PG Room', rent_amount: 8500, lat: 12.9166, lng: 77.6101, amenities: { wifi: true, meals: true }, photos: ['https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543215', description: 'Affordable PG with meals near BTM Layout 2nd Stage', property_type: 'pg', locality: 'BTM Layout', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-7', property_id: null, unit_number: 'Marathahalli 1BHK Flat', rent_amount: 20000, lat: 12.9591, lng: 77.6972, amenities: { wifi: true, ac: true }, photos: ['https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543216', description: '1BHK flat close to Marathahalli bridge and tech parks', property_type: 'flat', locality: 'Marathahalli', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-8', property_id: null, unit_number: 'Electronic City PG Room', rent_amount: 7500, lat: 12.8394, lng: 77.6786, amenities: { wifi: true, meals: true, laundry: true }, photos: ['https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543217', description: 'Budget PG with all meals near Electronic City Phase 1', property_type: 'pg', locality: 'Electronic City', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-9', property_id: null, unit_number: 'MG Road Studio Flat', rent_amount: 32000, lat: 12.9756, lng: 77.6097, amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543218', description: 'Premium studio in the CBD with all amenities', property_type: 'studio', locality: 'MG Road', is_available: true, created_at: new Date().toISOString() },
  { id: 'demo-10', property_id: null, unit_number: 'Bellandur Lake View Flat', rent_amount: 22000, lat: 12.9261, lng: 77.6762, amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/2079246/pexels-photo-2079246.jpeg?auto=compress&cs=tinysrgb&w=800'], contact_wa: '919876543219', description: 'Beautiful 1BHK with lake view near Bellandur', property_type: 'flat', locality: 'Bellandur', is_available: true, created_at: new Date().toISOString() },
];

const fetcher = async (url: string): Promise<Listing[]> => {
  const res = await fetch(url);
  const data = await res.json();
  const listings = (data.listings ?? []) as Listing[];
  // If DB has no listings yet, return demo data
  return listings.length > 0 ? listings : DEMO_LISTINGS;
};

export function useListings() {
  const { data, error, isLoading, mutate } = useSWR<Listing[]>(
    '/api/listings',
    fetcher,
    { refreshInterval: 30000, fallbackData: DEMO_LISTINGS }
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pg' | 'flat'>('all');
  const [rentRange, setRentRange] = useState<[number, number]>([3000, 50000]);
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const source = data ?? DEMO_LISTINGS;
    return source.filter(l => {
      // Text search on unit name or locality
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !l.unit_number.toLowerCase().includes(q) &&
          !(l.locality ?? '').toLowerCase().includes(q) &&
          !(l.description ?? '').toLowerCase().includes(q)
        ) return false;
      }

      // Type filter
      if (typeFilter === 'pg' && l.property_type !== 'pg') return false;
      if (typeFilter === 'flat' && l.property_type === 'pg') return false;

      // Rent range
      if (l.rent_amount < rentRange[0] || l.rent_amount > rentRange[1]) return false;

      // Amenity filter (must have all selected)
      for (const am of amenityFilter) {
        if (!l.amenities[am as keyof typeof l.amenities]) return false;
      }

      return true;
    });
  }, [data, search, typeFilter, rentRange, amenityFilter]);

  return {
    listings: data ?? DEMO_LISTINGS,
    filtered,
    isLoading,
    error,
    mutate,
    // filter state
    search, setSearch,
    typeFilter, setTypeFilter,
    rentRange, setRentRange,
    amenityFilter, setAmenityFilter,
  };
}
