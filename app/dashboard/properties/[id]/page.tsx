'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Building2, Users, CreditCard, ChevronRight, X, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { RentGrid } from '@/components/rent/RentGrid';
import { PricingComparison } from '@/components/property/PricingComparison';
import { UnitInvitePanel } from '@/components/invites/UnitInvitePanel';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<any>(null);
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const supabase = createClient();

  const photos: string[] = property?.photos ?? [];

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevPhoto = useCallback(() => setLightboxIndex(i => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length]);
  const nextPhoto = useCallback(() => setLightboxIndex(i => (i !== null ? (i + 1) % photos.length : null)), [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, closeLightbox, prevPhoto, nextPhoto]);

  useEffect(() => {
    const load = async () => {
      const [propRes, tenRes, payRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', params.id).single(),
        supabase.from('tenancies').select('*, profiles(name)').eq('property_id', params.id).order('unit_number'),
        supabase.from('rent_payments').select(`
          id, tenancy_id, amount_paid, payment_date, month_year, status,
          tenancies!inner(unit_number, property_id, profiles(name))
        `).eq('tenancies.property_id', params.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setProperty(propRes.data);
      setTenancies(tenRes.data ?? []);
      setPayments(payRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) return <div className="p-8 text-slate-500 text-sm">Loading…</div>;
  if (!property) return <div className="p-8 text-slate-500 text-sm">Property not found.</div>;

  const occupied = tenancies.filter(t => t.status === 'active' && t.tenant_id).length;
  const totalRent = tenancies.filter(t => t.status === 'active').reduce((s, t) => s + (t.rent_amount ?? 0), 0);

  return (
    <>
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Link href="/dashboard/properties" className="hover:text-slate-700 transition-colors">Properties</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700">{property.name}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-900/40 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{property.name}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{property.address}</p>
            </div>
          </div>
          <Link href={`/dashboard/properties/${property.id}/edit`} className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
            Edit Details
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-200/50 pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Total Units</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{property.unit_count}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Occupied</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{occupied}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Monthly Revenue</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalRent)}</p>
          </div>
        </div>

        {/* ── NEW: PROPERTY DETAILS GRID ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 border-t border-slate-200/50 pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">BHK</span>
              <span className="font-semibold text-slate-800">{property.bhk || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Size (sqft)</span>
              <span className="font-semibold text-slate-800">{property.size_sqft || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Floor</span>
              <span className="font-semibold text-slate-800">{property.floor_number || '-'} / {property.total_floors || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Duplex?</span>
              <span className="font-semibold text-slate-800">{property.is_duplex ? 'Yes' : 'No'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Door facing</span>
              <span className="font-semibold text-slate-800 capitalize">{property.door_facing || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Furnishing</span>
              <span className="font-semibold text-slate-800 capitalize">{property.furnishing || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Solar / Borewell</span>
              <span className="font-semibold text-slate-800">
                {property.has_solar ? 'Yes' : 'No'} / {property.has_borewell ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Electricity</span>
              <span className="font-semibold text-slate-800">
                {property.electricity_model === 'included' ? 'Included' : property.electricity_model === 'eb_meter' ? 'EB Meter' : formatCurrency(property.electricity_fixed || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Water</span>
              <span className="font-semibold text-slate-800">
                {property.water_model === 'included' ? 'Included' : property.water_model === 'borewell_free' ? 'Borewell (Free)' : formatCurrency(property.water_fixed || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Security dep.</span>
              <span className="font-semibold text-slate-800">{formatCurrency(property.security_deposit || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Maintenance</span>
              <span className="font-semibold text-slate-800">{formatCurrency(property.maintenance_charge || 0)}</span>
            </div>
          </div>
        </div>

        {/* ── NEW: AMENITIES CHIPS ── */}
        <div className="mt-6 border-t border-slate-200/50 pt-5 flex flex-wrap gap-2">
          {[
            { label: 'Solar Water', val: property.has_solar },
            { label: 'Borewell', val: property.has_borewell },
            { label: 'Covered Parking', val: property.has_parking },
            { label: 'Wi-Fi', val: property.has_wifi },
            { label: 'AC', val: property.has_ac },
            { label: 'Lift', val: property.has_lift },
            { label: 'Gym', val: property.has_gym },
            { label: '24x7 Security', val: property.has_security }
          ].map(a => (
            <div key={a.label} className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${a.val ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              {a.label}
            </div>
          ))}
        </div>

        {/* ── PHOTOS STRIP ── */}
        {property.photos && property.photos.length > 0 && (
          <div className="mt-6 border-t border-slate-200/50 pt-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Photos <span className="text-slate-400 font-normal">({property.photos.length})</span></h3>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {property.photos.map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt={`Property photo ${i + 1}`}
                  onClick={() => setLightboxIndex(i)}
                  className="h-32 w-auto rounded-lg object-cover shadow-sm snap-start shrink-0 border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all"
                />
              ))}
            </div>
          </div>
        )}

        {/* ── NEW: MAP EMBED ── */}
        {property.address && property.lat && property.lng && (
          <div className="mt-6 border-t border-slate-200/50 pt-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Location Preview</h3>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-[220px]">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(property.address)}&output=embed`}
              ></iframe>
            </div>
          </div>
        )}

        {/* ── NEW: UNIT BREAKDOWNS ── */}
        {property.unit_details && property.unit_details.length > 0 && (
          <div className="mt-6 border-t border-slate-200/50 pt-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Unit Breakdowns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {property.unit_details.map((u: any, i: number) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Unit {u.unit_number}</p>
                    <p className="text-[10px] uppercase text-slate-500 font-semibold mt-1">
                      {u.bhk ? `${u.bhk} BHK` : 'Global BHK'} • {u.size_sqft ? `${u.size_sqft} sqft` : 'Global Size'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {u.rent_price ? formatCurrency(u.rent_price) : 'Global Pricing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── UNITS & INVITES ── */}
        <UnitInvitePanel
          propertyId={property.id}
          totalUnits={property.total_units ?? property.unit_count ?? 1}
          propertyName={property.name}
        />
      </div>

      {/* ── NEW: PRICING COMPARISON PANEL ── */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Pricing Comparison</h2>
        <PricingComparison 
          rentPrice={property.rent_price}
          pgSharing={property.pg_price_sharing}
          pgSingle={property.pg_price_single}
          maintenance={property.maintenance_charge}
          electricityFixed={property.electricity_fixed}
          waterFixed={property.water_fixed}
          deposit={property.security_deposit}
          bhk={property.bhk}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">Tenancies</h2>
          {tenancies.length < (property.total_units || 1) && (
            <button
              onClick={async () => {
                if(!confirm('Auto-generate missing flats?')) return;
                await fetch(`/api/properties/${property.id}/generate-units`, { method: 'POST' });
                window.location.reload();
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Auto-generate Flats
            </button>
          )}
        </div>
        {tenancies.length === 0 ? (
          <p className="text-slate-500 text-sm">No tenancies yet.</p>
        ) : (
          <div className="space-y-2">
            {tenancies.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{t.profiles?.name ?? 'Vacant'} — {t.unit_number}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(t.rent_amount)}/mo · Due day {t.due_day}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Recent Payments</h2>
        <RentGrid rows={payments as Parameters<typeof RentGrid>[0]['rows']} />
      </div>
    </div>

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-semibold">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
            >
              <ChevronRightIcon className="w-7 h-7" />
            </button>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIndex ? 'border-white scale-110' : 'border-white/30 opacity-60 hover:opacity-90'}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
