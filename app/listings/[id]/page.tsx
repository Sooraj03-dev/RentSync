import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wifi, Wind, Car, Utensils, Droplets, MapPin, Phone, Building2 } from 'lucide-react';
import { PricingComparison } from '@/components/property/PricingComparison';

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !listing) {
    return notFound();
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
               {[
                { label: 'Solar Water', val: listing.has_solar },
                { label: 'Borewell', val: listing.has_borewell },
                { label: 'Covered Parking', val: listing.has_parking || listing.amenities?.includes('parking') },
                { label: 'Wi-Fi', val: listing.has_wifi || listing.amenities?.includes('wifi') },
                { label: 'AC', val: listing.has_ac || listing.amenities?.includes('ac') },
                { label: 'Lift', val: listing.has_lift || listing.amenities?.includes('lift') },
                { label: 'Gym', val: listing.has_gym || listing.amenities?.includes('gym') },
                { label: 'Security', val: listing.has_security || listing.amenities?.includes('security') }
              ].map(a => a.val && (
                <div key={a.label} className="px-3 py-1.5 text-sm font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {a.label}
                </div>
              ))}
              {(!listing.has_solar && !listing.has_parking && !listing.has_wifi && !listing.amenities?.length) && (
                 <p className="text-slate-500 text-sm">No amenities listed.</p>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
