'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, PropertyFormValues } from '@/lib/validations/property';
import { CompassPicker } from '@/components/property/CompassPicker';
import { PricingComparison } from '@/components/property/PricingComparison';
import { Loader2, ArrowRight, ArrowLeft, UploadCloud, X, MapPin, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const DRAFT_KEY = 'rentsync_property_draft';

const STEPS = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Location' },
  { id: 3, name: 'Amenities' },
  { id: 4, name: 'Billing' },
  { id: 5, name: 'Photos & Pricing' }
];

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const supabase = createClient();

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      total_units: 1,
      bhk: 1,
      is_duplex: false,
      furnishing: 'unfurnished',
      has_solar: false,
      has_borewell: false,
      has_parking: false,
      has_wifi: false,
      has_ac: false,
      has_lift: false,
      has_gym: false,
      has_security: false,
      electricity_model: 'eb_meter',
      water_model: 'borewell_free',
      maintenance_charge: 0,
      security_deposit: 0,
      photos: []
    }
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = form;

  const { fields: unitFields, append: appendUnit, remove: removeUnit } = useFieldArray({
    control,
    name: 'unit_details'
  });

  const totalUnits = watch('total_units');

  // Restore draft or load existing
  useEffect(() => {
    setIsClient(true);
    const draft = localStorage.getItem(DRAFT_KEY + '_' + params.id);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        Object.keys(parsed).forEach(key => setValue(key as any, parsed[key]));
        return;
      } catch (e) {}
    }

    // Load existing property
    supabase.from('properties').select('*').eq('id', params.id).single()
      .then(({ data }) => {
        if (data) {
          Object.keys(data).forEach(key => {
            if (key in propertySchema.shape) {
              setValue(key as any, data[key]);
            }
          });
        }
      });
  }, [setValue, params.id, supabase]);

  // Save draft on change
  useEffect(() => {
    if (!isClient) return;
    const subscription = watch((value: any) => {
      localStorage.setItem(DRAFT_KEY + '_' + params.id, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch, isClient, params.id]);

  const handleNext = async () => {
    // Basic validation per step before proceeding
    const fieldsByStep: any = {
      1: ['name', 'address', 'total_units', 'bhk'],
      2: [], // optional
      3: ['furnishing'],
      4: ['electricity_model', 'water_model', 'maintenance_charge', 'security_deposit'],
      5: ['rent_price', 'pg_price_sharing', 'pg_price_single']
    };
    
    const valid = await form.trigger(fieldsByStep[step]);
    if (valid) {
      setStep(s => Math.min(s + 1, 5));
      window.scrollTo(0,0);
    }
  };

  const onSubmit = async (data: PropertyFormValues) => {
    setIsSubmitting(true);
    try {
      // Strip NaN values so Postgres doesn't choke
      const clean: any = {};
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'number' && isNaN(v)) continue;
        if (v === undefined || v === null || v === '') continue;
        clean[k] = v;
      }

      // Upload photos to Supabase Storage
      const photoUrls: string[] = clean.photos || [];
      if (photoFiles.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        for (const file of photoFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('properties')
            .upload(filePath, file);
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Failed to upload photos. You may need to create a public "properties" storage bucket in Supabase.');
          }
          
          const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(filePath);
          photoUrls.push(publicUrl);
        }
      }
      
      clean.photos = photoUrls;

      const res = await fetch(`/api/properties/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean)
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      localStorage.removeItem(DRAFT_KEY + '_' + params.id);
      router.push(`/dashboard/properties/${params.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to update property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract lat/lng from URL
  const handleUrlPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setValue('google_maps_url', url);
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) {
      setValue('lat', parseFloat(match[1]));
      setValue('lng', parseFloat(match[2]));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/dashboard/properties');
    } catch (e) {
      alert('Error deleting property');
      setIsSubmitting(false);
    }
  };

  if (!isClient) return null; // Avoid hydration mismatch

  const values = watch();

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Property</h1>
          <p className="text-slate-500 text-sm mt-1">Update your property profile details.</p>
        </div>
        <button 
          type="button" 
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors border border-red-100"
        >
          <Trash2 className="w-4 h-4" /> Delete Property
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-300" 
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        ></div>
        {STEPS.map((s, i) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400 border-2 border-white shadow-sm'
            }`}>
              {s.id}
            </div>
            <span className={`absolute top-10 text-[10px] font-semibold whitespace-nowrap hidden md:block ${
              step >= s.id ? 'text-blue-800' : 'text-slate-400'
            }`}>{s.name}</span>
          </div>
        ))}
      </div>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        className="space-y-8 mt-12"
      >
        
        {/* STEP 1: Basic Info */}
        <div className={step === 1 ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Property Name *</label>
              <input {...register('name')} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. Shivom PG, Royal Apartments" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address *</label>
              <textarea {...register('address')} rows={3} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="123 Main St, Area, City" />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Units *</label>
                <input type="number" {...register('total_units', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">BHK *</label>
                <select {...register('bhk', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none bg-white">
                  <option value={0}>Studio / 1RK</option>
                  <option value={1}>1 BHK</option>
                  <option value={2}>2 BHK</option>
                  <option value={3}>3 BHK</option>
                  <option value={4}>4 BHK</option>
                  <option value={5}>5+ BHK</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Size (sq ft)</label>
                <input type="number" {...register('size_sqft', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. 1200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Floor Number</label>
                <input type="number" {...register('floor_number', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. 2" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Floors in Bldg</label>
                <input type="number" {...register('total_floors', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. 5" />
              </div>
              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-3 cursor-pointer mt-5">
                  <input type="checkbox" {...register('is_duplex')} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-semibold text-slate-700">Is this a Duplex?</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: Location & Facing */}
        <div className={step === 2 ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Location & Orientation</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Google Maps Link</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="url" 
                    onChange={handleUrlPaste}
                    value={values.google_maps_url || ''}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                    placeholder="Paste Google Maps URL here to auto-extract location..." 
                  />
                </div>
              </div>
              {errors.google_maps_url && <p className="text-red-500 text-xs mt-1">{errors.google_maps_url.message}</p>}
            </div>

            {values.address && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <iframe
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(values.address)}&output=embed`}
                ></iframe>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Lat (auto-filled)</label>
                <input type="number" step="any" {...register('lat', { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Lng (auto-filled)</label>
                <input type="number" step="any" {...register('lng', { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <CompassPicker 
                value={values.door_facing} 
                onChange={(dir) => setValue('door_facing', dir)} 
              />
            </div>
          </div>
        </div>

        {/* STEP 3: Amenities */}
        <div className={step === 3 ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Furnishing Status</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { id: 'unfurnished', label: 'Unfurnished', desc: 'Bare walls, no appliances' },
                  { id: 'semi', label: 'Semi-furnished', desc: 'Basic appliances (fan, lights, geyser)' },
                  { id: 'fully', label: 'Fully-furnished', desc: 'Bed, sofa, fridge, AC, etc.' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setValue('furnishing', opt.id as any)}
                    className={`text-left p-4 rounded-xl border-2 transition-colors ${
                      values.furnishing === opt.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <p className={`font-bold ${values.furnishing === opt.id ? 'text-blue-800' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Included Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'has_solar', label: 'Solar Water' },
                  { key: 'has_borewell', label: 'Borewell' },
                  { key: 'has_parking', label: 'Parking' },
                  { key: 'has_wifi', label: 'Wi-Fi' },
                  { key: 'has_ac', label: 'Air Con.' },
                  { key: 'has_lift', label: 'Lift / Elev.' },
                  { key: 'has_gym', label: 'Gym / Fit.' },
                  { key: 'has_security', label: 'Security 24x7' }
                ].map((amenity) => (
                  <label key={amenity.key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    (values as any)[amenity.key] ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input type="checkbox" {...register(amenity.key as any)} className="w-4 h-4 text-emerald-600 rounded" />
                    <span className="text-sm font-semibold text-slate-700">{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* STEP 4: Billing */}
        <div className={step === 4 ? 'block' : 'hidden'}>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Utility Billing Models</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">Electricity</h3>
                <div className="space-y-2">
                  {[
                    { id: 'included', label: 'Included in Rent' },
                    { id: 'eb_meter', label: 'Tenant pays BESCOM (Metered)' },
                    { id: 'landlord_fixed', label: 'Fixed Monthly Charge' }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3">
                      <input type="radio" value={opt.id} {...register('electricity_model')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {values.electricity_model === 'landlord_fixed' && (
                  <input type="number" {...register('electricity_fixed', { valueAsNumber: true })} placeholder="₹/mo" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none mt-2" />
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">Water Supply</h3>
                <div className="space-y-2">
                  {[
                    { id: 'included', label: 'Included in Rent' },
                    { id: 'borewell_free', label: 'Borewell (Free)' },
                    { id: 'fixed', label: 'Fixed Monthly Charge' }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3">
                      <input type="radio" value={opt.id} {...register('water_model')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {values.water_model === 'fixed' && (
                  <input type="number" {...register('water_fixed', { valueAsNumber: true })} placeholder="₹/mo" className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none mt-2" />
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Society Maintenance (₹/mo)</label>
                <input type="number" {...register('maintenance_charge', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Security Deposit (₹)</label>
                <input type="number" {...register('security_deposit', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="e.g. 50000" />
              </div>
            </div>

          </div>
        </div>

        {/* STEP 5: Pricing & Photos */}
        <div className={step === 5 ? 'block' : 'hidden'}>
          <div className="grid lg:grid-cols-2 gap-6">
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Pricing Settings</h2>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Whole-house Rental (₹/mo)</label>
                  <input type="number" {...register('rent_price', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="Leave empty if PG only" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">PG Sharing (₹/mo)</label>
                    <input type="number" {...register('pg_price_sharing', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">PG Single (₹/mo)</label>
                    <input type="number" {...register('pg_price_single', { valueAsNumber: true })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 outline-none" placeholder="0" />
                  </div>
                </div>
              </div>

              {totalUnits && totalUnits > 1 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h2 className="text-lg font-bold text-slate-800">Unit Breakdowns</h2>
                    <button 
                      type="button" 
                      onClick={() => appendUnit({ unit_number: '', rent_price: undefined, size_sqft: undefined, bhk: undefined })}
                      className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      + Add Unit
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Define specific rent, size, and BHK for individual flats.</p>
                  
                  {unitFields.map((field, index) => (
                    <div key={field.id} className="relative p-4 border border-slate-200 rounded-xl bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button 
                        type="button" 
                        onClick={() => removeUnit(index)} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit No</label>
                        <input {...register(`unit_details.${index}.unit_number`)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 outline-none text-sm mt-1" placeholder="e.g. 101" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Rent (₹)</label>
                        <input type="number" {...register(`unit_details.${index}.rent_price`, { valueAsNumber: true })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 outline-none text-sm mt-1" placeholder="Global if empty" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Size (sqft)</label>
                        <input type="number" {...register(`unit_details.${index}.size_sqft`, { valueAsNumber: true })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 outline-none text-sm mt-1" placeholder="Global if empty" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">BHK</label>
                        <input type="number" {...register(`unit_details.${index}.bhk`, { valueAsNumber: true })} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 outline-none text-sm mt-1" placeholder="Global if empty" />
                      </div>
                    </div>
                  ))}
                  {unitFields.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No specific units defined. All flats will use global pricing.
                    </div>
                  )}
                </div>
              )}

              {/* Photos Uploader */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Photos</h2>
                
                {/* Existing Photos */}
                {values.photos && values.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {values.photos.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={url} alt="existing" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => {
                            const newPhotos = [...values.photos];
                            newPhotos.splice(i, 1);
                            setValue('photos', newPhotos);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 8 - (values.photos?.length || 0) - photoFiles.length);
                      setPhotoFiles(prev => [...prev, ...newFiles]);
                    }
                  }}
                >
                  <UploadCloud className="w-10 h-10 mb-3 text-blue-400" />
                  <p className="text-sm font-bold text-slate-600">Click or Drag & Drop New Photos</p>
                  <p className="text-xs mt-1 text-slate-400">Up to 8 images total (JPG, PNG)</p>
                  <input 
                    type="file" 
                    id="photo-upload" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files).slice(0, 8 - (values.photos?.length || 0) - photoFiles.length);
                        setPhotoFiles(prev => [...prev, ...newFiles]);
                      }
                    }}
                  />
                </div>

                {photoFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {photoFiles.map((file, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setPhotoFiles(files => files.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">Live Preview</h2>
              <PricingComparison 
                rentPrice={values.rent_price}
                pgSharing={values.pg_price_sharing}
                pgSingle={values.pg_price_single}
                maintenance={values.maintenance_charge}
                electricityFixed={values.electricity_fixed}
                waterFixed={values.water_fixed}
                deposit={values.security_deposit}
                bhk={values.bhk}
              />
            </div>

          </div>
        </div>

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 w-full md:left-64 md:w-[calc(100%-16rem)] bg-white border-t border-slate-200 p-4 px-6 flex justify-between z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <button 
            type="button" 
            onClick={() => setStep(s => Math.max(s - 1, 1))}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors ${
              step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
            }`}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {step < 5 ? (
            <button 
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-blue-200"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-emerald-200"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
