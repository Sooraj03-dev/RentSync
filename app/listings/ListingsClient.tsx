'use client';

import { useState } from 'react';
import useSWR from 'swr';
import ListingsMap from '@/components/map/ListingsMap';
import { Search, SlidersHorizontal } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ListingsClient() {
  const { data, error, isLoading } = useSWR('/api/listings', fetcher, { refreshInterval: 30000 });

  const [maxRent, setMaxRent] = useState(50000);
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');

  // Filter logic
  let features = data?.features || [];
  
  if (maxRent < 50000) {
    features = features.filter((f: any) => f.properties.rent_amount <= maxRent);
  }
  
  if (type !== 'All') {
    // Assuming amenities might contain 'PG' or 'Flat' or we filter by something else.
    // The seed data has "PG" or "Flat" in the unit_number like "Koramangala 5th Block PG"
    features = features.filter((f: any) => f.properties.unit_number.toLowerCase().includes(type.toLowerCase()));
  }

  if (search.trim()) {
    features = features.filter((f: any) => 
      f.properties.unit_number.toLowerCase().includes(search.toLowerCase()) || 
      (f.properties.amenities && f.properties.amenities.some((a: string) => a.toLowerCase().includes(search.toLowerCase())))
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50">
      
      {/* Filter Bar */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search locality..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
            {['All', 'PG', 'Flat'].map(t => (
              <button 
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${type === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 shrink-0"></div>

          {/* Rent Slider */}
          <div className="flex items-center gap-3 shrink-0 min-w-[200px]">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col w-full">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>₹0</span>
                <span className="text-blue-600">Max: ₹{maxRent.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50000" 
                step="1000"
                value={maxRent}
                onChange={(e) => setMaxRent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative p-4">
        {isLoading ? (
          <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400">Loading properties...</div>
        ) : error ? (
          <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center text-red-500">Failed to load listings.</div>
        ) : (
          <ListingsMap features={features} />
        )}
      </div>

    </div>
  );
}
