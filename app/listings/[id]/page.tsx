import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wifi, Wind, Car, Utensils, Droplets, MapPin, Phone } from 'lucide-react';

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

          <div className="mt-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{listing.unit_number}</h1>
              <p className="text-slate-500 flex items-center gap-1 mt-1 text-sm">
                <MapPin className="w-3.5 h-3.5" /> 
                Bengaluru
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">₹{listing.rent_amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Per Month</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Amenities</h3>
            {listing.amenities && listing.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.amenities.map((a: string) => (
                  <div key={a} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm font-medium">
                    <span className="text-blue-500">{getAmenityIcon(a)}</span>
                    {a}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No amenities listed.</p>
            )}
          </div>

        </main>

        {/* Floating CTA */}
        <div className="fixed bottom-0 max-w-3xl w-full p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <a 
            href={`https://wa.me/${listing.contact_wa}?text=Hi, I'm interested in your property: ${listing.unit_number}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-[#25D366]/20"
          >
            <Phone className="w-5 h-5" />
            Message Landlord on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
