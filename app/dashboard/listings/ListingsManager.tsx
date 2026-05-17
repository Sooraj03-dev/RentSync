'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, ToggleLeft, ToggleRight, Loader2, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type Unit = {
  id: string; // tenancy id
  unit_number: string;
  rent_amount: number;
  status: string;
  property_id: string;
  properties?: any;
};

type Listing = {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  lat: number;
  lng: number;
  amenities: string[];
  contact_wa: string;
  is_available: boolean;
};

export default function ListingsManager({ units, initialListings }: { units: Unit[], initialListings: Listing[] }) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [saving, setSaving] = useState<string | null>(null);
  const supabase = createClient();

  const handleToggle = async (unit: Unit) => {
    setSaving(unit.id);
    const existing = listings.find(l => l.unit_number === unit.unit_number);
    const isNowAvailable = !(existing?.is_available || false);

    if (existing) {
      const { data, error } = await supabase
        .from('listings')
        .update({ is_available: isNowAvailable })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (!error && data) {
        setListings(listings.map(l => l.id === data.id ? data : l));
      }
    } else {
      // Create new listing
      const prop = unit.properties || {};
      const lat = prop.lat || 12.9716 + (Math.random() - 0.5) * 0.1;
      const lng = prop.lng || 77.5946 + (Math.random() - 0.5) * 0.1;
      
      const amenitiesArr = [];
      if (prop.has_wifi) amenitiesArr.push('wifi');
      if (prop.has_ac) amenitiesArr.push('ac');
      if (prop.has_parking) amenitiesArr.push('parking');
      if (prop.has_gym) amenitiesArr.push('gym');
      if (prop.has_lift) amenitiesArr.push('lift');
      if (prop.has_security) amenitiesArr.push('security');
      
      const { data, error } = await supabase
        .from('listings')
        .insert({
          property_id: unit.property_id,
          unit_number: unit.unit_number,
          rent_amount: prop.rent_price || unit.rent_amount,
          lat,
          lng,
          amenities: amenitiesArr,
          contact_wa: '919876543210',
          is_available: true,
          size_sqft: prop.size_sqft,
          bhk: prop.bhk,
          door_facing: prop.door_facing,
          furnishing: prop.furnishing,
          has_solar: prop.has_solar,
          has_borewell: prop.has_borewell,
          electricity_model: prop.electricity_model,
          water_model: prop.water_model,
          rent_price: prop.rent_price,
          pg_price_sharing: prop.pg_price_sharing,
          pg_price_single: prop.pg_price_single,
          security_deposit: prop.security_deposit,
          maintenance_charge: prop.maintenance_charge,
          floor_number: prop.floor_number,
          total_floors: prop.total_floors,
          is_duplex: prop.is_duplex,
          photos: prop.photos ? prop.photos.slice(0, 5) : null
        })
        .select()
        .single();

      if (!error && data) {
        setListings([...listings, data]);
      }
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4">Unit Number</th>
              <th className="px-6 py-4">Rent Amount</th>
              <th className="px-6 py-4">Current Status</th>
              <th className="px-6 py-4 text-right">Mark Vacant (Map)</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {units.map((unit) => {
              const listing = listings.find(l => l.unit_number === unit.unit_number);
              const isAvailable = listing?.is_available || false;

              return (
                <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{unit.unit_number}</td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(unit.rent_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                      unit.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggle(unit)}
                      disabled={saving === unit.id}
                      className="inline-flex items-center gap-2"
                    >
                      {saving === unit.id ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      ) : isAvailable ? (
                        <ToggleRight className="w-8 h-8 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
            {units.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No units found. Add a property and unit first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
