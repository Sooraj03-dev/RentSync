'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useListings, type Listing } from '@/lib/hooks/useListings';
import {
  Search, Wifi, Wind, ParkingCircle, UtensilsCrossed, WashingMachine,
  X, ChevronLeft, Loader2, MapPin, SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic import of map to avoid SSR issues
const ListingsMap = dynamic(
  () => import('@/components/map/ListingsMap'),
  { ssr: false, loading: () => <div className="w-full h-full bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div> }
);

const AMENITY_OPTIONS = [
  { key: 'wifi', label: 'WiFi', icon: Wifi },
  { key: 'ac', label: 'AC', icon: Wind },
  { key: 'parking', label: 'Parking', icon: ParkingCircle },
  { key: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { key: 'laundry', label: 'Laundry', icon: WashingMachine },
];

function formatRent(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function AmenityIcons({ amenities, small = false }: { amenities: Listing['amenities']; small?: boolean }) {
  const size = small ? 'w-3 h-3' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-1.5">
      {amenities.wifi && <Wifi className={cn(size, 'text-blue-400')} />}
      {amenities.ac && <Wind className={cn(size, 'text-cyan-400')} />}
      {amenities.parking && <ParkingCircle className={cn(size, 'text-purple-400')} />}
      {amenities.meals && <UtensilsCrossed className={cn(size, 'text-orange-400')} />}
      {amenities.laundry && <WashingMachine className={cn(size, 'text-green-400')} />}
    </div>
  );
}

// Gradient placeholder backgrounds for listings without photos
const GRADIENTS = [
  'from-blue-900 to-indigo-950',
  'from-violet-900 to-purple-950',
  'from-emerald-900 to-teal-950',
  'from-rose-900 to-pink-950',
  'from-amber-900 to-orange-950',
];

function ListingCard({
  listing,
  isActive,
  onClick,
}: {
  listing: Listing;
  isActive: boolean;
  onClick: () => void;
}) {
  const gradient = GRADIENTS[listing.unit_number.length % GRADIENTS.length];
  const waText = encodeURIComponent(`Hi, I'm interested in ${listing.unit_number} listed on RentSync`);
  const waUrl = `https://wa.me/${listing.contact_wa}?text=${waText}`;

  return (
    <div
      className={cn(
        'rounded-xl border transition-all cursor-pointer group overflow-hidden',
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
          : 'border-zinc-200 bg-white hover:shadow-sm hover:border-zinc-300'
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className={cn('relative h-32 bg-gradient-to-br overflow-hidden', gradient)}>
        {listing.photos?.[0] ? (
          <img src={listing.photos[0]} alt={listing.unit_number} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-60">🏠</span>
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {formatRent(listing.rent_amount)}/mo
          </span>
        </div>
        {/* Type tag */}
        {listing.property_type && (
          <div className="absolute top-2 left-2">
            <span className="bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {listing.property_type}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-1">{listing.unit_number}</p>
        </div>
        {listing.locality && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-500 truncate">{listing.locality}</p>
          </div>
        )}

        <AmenityIcons amenities={listing.amenities} />

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Link
            href={`/listings/${listing.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors text-center"
          >
            View Details
          </Link>
          <Link
            href={`/tenant/messages?property=${listing.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <span className="text-sm">💬</span> Chat
          </Link>
        </div>
      </div>
    </div>
  );
}

// Dual-thumb rent range slider
function RentRangeSlider({
  value, onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const MIN = 3000;
  const MAX = 50000;
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-500">Rent Range</span>
        <span className="text-xs font-bold text-zinc-800">
          ₹{value[0].toLocaleString('en-IN')} – ₹{value[1].toLocaleString('en-IN')}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1.5 bg-zinc-200 rounded-full" />
        <div
          className="absolute h-1.5 bg-blue-500 rounded-full"
          style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
        />
        <input
          type="range" min={MIN} max={MAX} step={500} value={value[0]}
          onChange={e => {
            const v = Math.min(+e.target.value, value[1] - 1000);
            onChange([v, value[1]]);
          }}
          className="absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: value[0] > (MAX - MIN) / 2 + MIN ? 5 : 3 }}
        />
        <input
          type="range" min={MIN} max={MAX} step={500} value={value[1]}
          onChange={e => {
            const v = Math.max(+e.target.value, value[0] + 1000);
            onChange([value[0], v]);
          }}
          className="absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />
        {/* Thumbs */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-none"
          style={{ left: `calc(${pct(value[0])}% - 8px)` }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-none"
          style={{ left: `calc(${pct(value[1])}% - 8px)` }}
        />
      </div>
    </div>
  );
}

export default function TenantFindPage() {
  const {
    filtered, isLoading,
    search, setSearch,
    typeFilter, setTypeFilter,
    rentRange, setRentRange,
    amenityFilter, setAmenityFilter,
  } = useListings();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput, setSearch]);

  const handleCardClick = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleMarkerClick = useCallback((id: string) => {
    setActiveId(id);
    // Scroll card into view
    setTimeout(() => {
      cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }, []);

  const toggleAmenity = (key: string) => {
    setAmenityFilter(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    );
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden bg-white">
      {/* ── LEFT PANEL ──────────────────────────────────────────── */}
      <div className="w-[380px] shrink-0 flex flex-col border-r border-zinc-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
          <h1 className="text-lg font-bold text-zinc-900 mb-3">Find a Home</h1>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search area, locality…"
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-400"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter + filter toggle */}
          <div className="flex items-center gap-2 mb-3">
            {(['all', 'pg', 'flat'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-full transition-all border',
                  typeFilter === t
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                )}
              >
                {t === 'all' ? 'All' : t.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={cn(
                'ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all',
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              )}
            >
              <SlidersHorizontal className="w-3 h-3" />
              Filters {amenityFilter.length > 0 && `(${amenityFilter.length})`}
            </button>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="space-y-3 pb-3 border-t border-zinc-100 pt-3">
              <RentRangeSlider value={rentRange} onChange={setRentRange} />

              <div>
                <p className="text-xs font-semibold text-zinc-500 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_OPTIONS.map(({ key, label, icon: Icon }) => {
                    const active = amenityFilter.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleAmenity(key)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all',
                          active
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Results count */}
          <p className="text-xs text-zinc-500 font-medium">
            {isLoading ? (
              <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading listings…</span>
            ) : (
              <><span className="font-bold text-zinc-800">{filtered.length}</span> {filtered.length === 1 ? 'place' : 'places'} found in Bengaluru</>
            )}
          </p>
        </div>

        {/* Listing cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 overflow-hidden animate-pulse">
                <div className="h-32 bg-zinc-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-zinc-100 rounded-full w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded-full w-1/2" />
                  <div className="h-8 bg-zinc-100 rounded-lg" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <MapPin className="w-10 h-10 mb-3 text-zinc-300" />
              <p className="text-sm font-medium">No listings match your filters</p>
              <p className="text-xs text-zinc-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filtered.map(listing => (
              <div key={listing.id} ref={el => { if (el) cardRefs.current.set(listing.id, el); }}>
                <ListingCard
                  listing={listing}
                  isActive={listing.id === activeId}
                  onClick={() => handleCardClick(listing.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: MAP ──────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <ListingsMap
          listings={filtered}
          activeId={activeId}
          onMarkerClick={handleMarkerClick}
        />
      </div>
    </div>
  );
}
