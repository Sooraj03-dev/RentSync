import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wifi, Wind, Car, Utensils, Droplets, MapPin, MessageSquare } from 'lucide-react';
import { PricingComparison } from '@/components/property/PricingComparison';

// Demo data duplicated here for SSR (can't import client hook on server)
const DEMO_LISTINGS = [
  { id: 'demo-1', unit_number: 'Koramangala PG Room', rent_amount: 9500, locality: 'Koramangala', amenities: { wifi: true, meals: true, laundry: true }, photos: ['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Spacious PG room with home-cooked meals in the heart of Koramangala', property_type: 'pg', contact_wa: '919876543210' },
  { id: 'demo-2', unit_number: 'Indiranagar 1BHK Flat', rent_amount: 24000, locality: 'Indiranagar', amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Modern 1BHK with AC and covered parking near 100 Feet Road', property_type: 'flat', contact_wa: '919876543211' },
  { id: 'demo-3', unit_number: 'HSR Layout PG Room', rent_amount: 10500, locality: 'HSR Layout', amenities: { wifi: true, laundry: true }, photos: ['https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Clean PG room in HSR Layout Sector 2 near tech parks', property_type: 'pg', contact_wa: '919876543212' },
  { id: 'demo-4', unit_number: 'Whitefield Studio Flat', rent_amount: 18000, locality: 'Whitefield', amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Studio apartment near ITPL, fully furnished with AC', property_type: 'studio', contact_wa: '919876543213' },
  { id: 'demo-5', unit_number: 'Jayanagar 2BHK Flat', rent_amount: 28000, locality: 'Jayanagar', amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Spacious 2BHK in premium Jayanagar 4th Block', property_type: 'flat', contact_wa: '919876543214' },
  { id: 'demo-6', unit_number: 'BTM Layout PG Room', rent_amount: 8500, locality: 'BTM Layout', amenities: { wifi: true, meals: true }, photos: ['https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Affordable PG with meals near BTM Layout 2nd Stage', property_type: 'pg', contact_wa: '919876543215' },
  { id: 'demo-7', unit_number: 'Marathahalli 1BHK Flat', rent_amount: 20000, locality: 'Marathahalli', amenities: { wifi: true, ac: true }, photos: ['https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&w=800'], description: '1BHK flat close to Marathahalli bridge and tech parks', property_type: 'flat', contact_wa: '919876543216' },
  { id: 'demo-8', unit_number: 'Electronic City PG Room', rent_amount: 7500, locality: 'Electronic City', amenities: { wifi: true, meals: true, laundry: true }, photos: ['https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Budget PG with all meals near Electronic City Phase 1', property_type: 'pg', contact_wa: '919876543217' },
  { id: 'demo-9', unit_number: 'MG Road Studio Flat', rent_amount: 32000, locality: 'MG Road', amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Premium studio in the CBD with all amenities', property_type: 'studio', contact_wa: '919876543218' },
  { id: 'demo-10', unit_number: 'Bellandur Lake View Flat', rent_amount: 22000, locality: 'Bellandur', amenities: { wifi: true, ac: true, parking: true }, photos: ['https://images.pexels.com/photos/2079246/pexels-photo-2079246.jpeg?auto=compress&cs=tinysrgb&w=800'], description: 'Beautiful 1BHK with lake view near Bellandur', property_type: 'flat', contact_wa: '919876543219' },
];

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Try demo data first for demo- IDs
  let listing: any = DEMO_LISTINGS.find(d => d.id === id) ?? null;

  if (!listing) {
    const supabase = createClient();
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
    if (error || !data) return notFound();
    listing = data;
  }

  // Helper to map amenity to an icon
  const getAmenityIcon = (name: string) => {
    const l = name.toLowerCase();
    if (l.includes('wifi')) return <Wifi className="w-4 h-4" />;
    if (l.includes('ac')) return <Wind className="w-4 h-4" />;
    if (l.includes('parking')) return <Car className="w-4 h-4" />;
    if (l.includes('meals')) return <Utensils className="w-4 h-4" />;
    if (l.includes('laundry')) return <Droplets className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const photos = listing.photos || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white shadow-sm min-h-screen">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <Link href="/listings" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
          <span className="font-bold text-slate-900">Listing Details</span>
          <div className="w-20" /> {/* Spacer */}
        </header>

        {/* Content */}
        <main className="p-6">
          
          {/* Photo Gallery (Horizontal Scroll) */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {photos.map((url: string, idx: number) => (
              <img 
                key={idx} 
                src={url} 
                alt={`Photo ${idx + 1}`} 
                className="w-full sm:w-[400px] h-[250px] object-cover rounded-xl snap-center shrink-0 border border-slate-200 shadow-sm"
              />
            ))}
          </div>

          <div className="mt-6">
            <h1 className="text-2xl font-bold text-slate-900">{listing.unit_number}</h1>
            <p className="text-slate-500 flex items-center gap-1 mt-1 text-sm">
              <MapPin className="w-3.5 h-3.5" /> 
              {listing.door_facing ? `Facing ${listing.door_facing} · ` : ''}Bengaluru
            </p>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
             <PricingComparison 
                rentPrice={listing.rent_price}
                pgSharing={listing.pg_price_sharing}
                pgSingle={listing.pg_price_single}
                maintenance={listing.maintenance_charge}
                electricityFixed={listing.electricity_fixed}
                waterFixed={listing.water_fixed}
                deposit={listing.security_deposit}
                bhk={listing.bhk}
                contactWa={listing.contact_wa}
              />
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Property Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 font-semibold mb-1">BHK</span>
                <span className="font-bold text-slate-800">{listing.bhk || '-'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 font-semibold mb-1">Size</span>
                <span className="font-bold text-slate-800">{listing.size_sqft ? `${listing.size_sqft} sqft` : '-'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 font-semibold mb-1">Furnishing</span>
                <span className="font-bold text-slate-800 capitalize">{listing.furnishing || '-'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 font-semibold mb-1">Floor</span>
                <span className="font-bold text-slate-800">{listing.floor_number || '-'}/{listing.total_floors || '-'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Amenities</h3>
            <div className="flex flex-wrap gap-2">
               {(() => {
                 const hasAmenity = (name: string) => {
                   if (Array.isArray(listing.amenities)) return listing.amenities.includes(name);
                   if (listing.amenities && typeof listing.amenities === 'object') return !!(listing.amenities as any)[name];
                   return false;
                 };
                 return [
                { label: 'Solar Water', val: listing.has_solar },
                { label: 'Borewell', val: listing.has_borewell },
                { label: 'Covered Parking', val: listing.has_parking || hasAmenity('parking') },
                { label: 'Wi-Fi', val: listing.has_wifi || hasAmenity('wifi') },
                { label: 'AC', val: listing.has_ac || hasAmenity('ac') },
                { label: 'Lift', val: listing.has_lift || hasAmenity('lift') },
                { label: 'Gym', val: listing.has_gym || hasAmenity('gym') },
                { label: 'Security', val: listing.has_security || hasAmenity('security') }
              ].map(a => a.val && (
                <div key={a.label} className="px-3 py-1.5 text-sm font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {a.label}
                </div>
              ));
              })()}
              {(!listing.has_solar && !listing.has_parking && !listing.has_wifi && !listing.amenities) && (
                 <p className="text-slate-500 text-sm">No amenities listed.</p>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
