'use client';

import { useEffect, useRef, useState } from 'react';
import type { Listing } from '@/lib/hooks/useListings';

// Using CartoDB Positron — stunning, highly visible light/white theme
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

interface Props {
  listings: Listing[];
  activeId: string | null;
  onMarkerClick: (id: string) => void;
}

function formatRent(amount: number) {
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`;
  return `₹${amount}`;
}

export default function ListingsMap({ listings = [], activeId, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const popupRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const prevActiveRef = useRef<string | null>(null);

  // ── Init map ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let maplibre: any;
    let map: any;

    import('maplibre-gl').then(mod => {
      maplibre = mod.default ?? mod;

      map = new maplibre.Map({
        container: containerRef.current!,
        style: MAP_STYLE,
        center: [77.5946, 12.9716],
        zoom: 11.5,
        pitch: 50,
        bearing: -10,
        antialias: true,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('error', (e: any) => {
        console.warn('Map error:', e?.error?.message ?? e);
      });

      map.on('load', () => {
        try {
          // ── 3D Buildings ──
          if (map.getSource('openmaptiles') || map.getSource('composite')) {
            const sourceId = map.getSource('openmaptiles') ? 'openmaptiles' : 'composite';
            map.addLayer({
              id: '3d-buildings',
              source: sourceId,
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': [
                  'interpolate', ['linear'], ['get', 'render_height'],
                  0, '#e2e8f0',
                  50, '#cbd5e1',
                  100, '#94a3b8',
                ],
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, ['get', 'render_height']],
                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, ['get', 'render_min_height']],
                'fill-extrusion-opacity': 0.7,
              },
            });
          }
        } catch (err) {
          console.warn('3D buildings skipped:', err);
        }

        // ── Navigation controls ──
        map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'bottom-right');
        map.addControl(
          new maplibre.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
          }),
          'bottom-right'
        );
        map.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-left');

        setMapReady(true);
      });
    }).catch(err => {
      console.error('MapLibre load error:', err);
      setMapError('Failed to load map library.');
    });

    return () => {
      try { map?.remove(); } catch (_) {}
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ── Sync markers when listings / activeId change ───────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import('maplibre-gl').then(mod => {
      const maplibre = mod.default ?? mod;
      const map = mapRef.current;
      if (!map) return;

      const currentIds = new Set(listings.map(l => l.id));

      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });

      listings.forEach(listing => {
        const isActive = listing.id === activeId;

        // Update existing marker style only
        if (markersRef.current.has(listing.id)) {
          const el = markersRef.current.get(listing.id).getElement() as HTMLElement;
          applyPinStyle(el, isActive);
          return;
        }

        // Create price pill element
        const el = document.createElement('div');
        el.textContent = formatRent(listing.rent_amount);
        applyPinStyle(el, isActive);

        el.addEventListener('mouseenter', () => {
          if (listing.id !== activeId) {
            el.style.transform = 'scale(1.12)';
            el.style.zIndex = '5';
          }
        });
        el.addEventListener('mouseleave', () => {
          if (listing.id !== activeId) {
            el.style.transform = 'scale(1)';
            el.style.zIndex = '1';
          }
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerClick(listing.id);

          map.flyTo({
            center: [listing.lng, listing.lat],
            zoom: 15.5,
            pitch: 62,
            bearing: 25,
            duration: 1400,
            essential: true,
          });

          // Remove old popup
          if (popupRef.current) { try { popupRef.current.remove(); } catch (_) {} }

          const waText = encodeURIComponent(
            `Hi! I'm interested in *${listing.unit_number}* listed on RentSync. Is it available?`
          );
          const amenityHtml = [
            listing.amenities.wifi && '<span>📶 WiFi</span>',
            listing.amenities.ac && '<span>❄️ AC</span>',
            listing.amenities.parking && '<span>🅿️ Parking</span>',
            listing.amenities.meals && '<span>🍽️ Meals</span>',
            listing.amenities.laundry && '<span>🧺 Laundry</span>',
          ].filter(Boolean).join(' ');

          const popup = new maplibre.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '270px',
            offset: [0, -10],
          })
            .setLngLat([listing.lng, listing.lat])
            .setHTML(`
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:4px;">
                ${listing.photos && listing.photos[0] 
                  ? `<div style="border-radius:10px;height:100px;margin-bottom:12px;overflow:hidden;border:1px solid #e2e8f0;"><img src="${listing.photos[0]}" style="width:100%;height:100%;object-fit:cover;" alt="Property photo"/></div>` 
                  : `<div style="background:linear-gradient(135deg,#e0e7ff 0%,#f1f5f9 100%);border-radius:10px;height:85px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:36px;border:1px solid #e2e8f0;box-shadow:inset 0 2px 4px rgba(255,255,255,0.8);">
                      ${listing.property_type === 'pg' ? '🛏️' : listing.property_type === 'studio' ? '🏢' : '🏠'}
                     </div>`
                }
                <p style="font-weight:800;font-size:15px;color:#1e293b;margin:0 0 4px;line-height:1.2;">${listing.unit_number}</p>
                <p style="font-size:12px;color:#64748b;margin:0 0 10px;display:flex;align-items:center;gap:4px;">
                  📍 ${listing.locality || 'Bengaluru'}
                  ${listing.property_type ? `<span style="background:#f1f5f9;color:#475569;font-size:10px;font-weight:700;padding:2px 6px;border-radius:20px;margin-left:4px;">${listing.property_type.toUpperCase()}</span>` : ''}
                </p>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:#475569;margin-bottom:12px;">
                  ${amenityHtml}
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                  <span style="background:#ecfdf5;color:#059669;font-weight:800;font-size:14px;padding:4px 10px;border-radius:20px;box-shadow:0 1px 2px rgba(16,185,129,0.1);">
                    ₹${listing.rent_amount.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div style="display:flex;gap:8px;">
                  <button style="flex:1;background:#f8fafc;color:#0f172a;border:1px solid #cbd5e1;padding:8px 0;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;">
                    View
                  </button>
                  <a href="/tenant/messages?property=${listing.id}"
                    style="flex:1.5;display:flex;align-items:center;justify-content:center;gap:6px;background:#2563eb;color:white;padding:8px 0;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;box-shadow:0 2px 4px rgba(37,99,235,0.2);">
                    💬 Chat
                  </a>
                </div>
              </div>
            `)
            .addTo(map);

          popupRef.current = popup;
        });

        const marker = new maplibre.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([listing.lng, listing.lat])
          .addTo(map);

        markersRef.current.set(listing.id, marker);
      });
    });
  }, [listings, activeId, mapReady, onMarkerClick]);

  // ── Fly to active when changed from sidebar card ───────────────
  useEffect(() => {
    if (!activeId || !mapReady || !mapRef.current) return;
    if (prevActiveRef.current === activeId) return;
    prevActiveRef.current = activeId;

    const listing = listings.find(l => l.id === activeId);
    if (!listing) return;

    mapRef.current.flyTo({
      center: [listing.lng, listing.lat],
      zoom: 15.5,
      pitch: 62,
      bearing: 25,
      duration: 1400,
      essential: true,
    });
  }, [activeId, mapReady, listings]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 gap-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-slate-200 rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-semibold text-sm">Loading Map…</p>
            <p className="text-slate-500 text-xs mt-1">RentSync Seamless Discovery</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 gap-3 p-8">
          <div className="text-5xl">🗺️</div>
          <p className="text-slate-900 font-bold">Map could not load</p>
          <p className="text-slate-500 text-sm text-center">{mapError}</p>
        </div>
      )}

      {/* Branding chip */}
      {mapReady && (
        <div className="absolute bottom-8 left-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md shadow-sm border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200" />
          Live · Positron
        </div>
      )}

      <style>{`
        .maplibregl-popup-content {
          padding: 10px !important;
          border-radius: 14px !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important;
          border: 1px solid rgba(0,0,0,0.05) !important;
          background: white !important;
        }
        .maplibregl-popup-close-button {
          font-size: 18px !important;
          padding: 2px 8px !important;
          color: #888 !important;
          line-height: 1 !important;
        }
        .maplibregl-popup-close-button:hover { color: #333 !important; }
        .maplibregl-ctrl-group {
          background: rgba(255,255,255,0.92) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          border-radius: 10px !important;
          overflow: hidden;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .maplibregl-ctrl-group button {
          color: #333 !important;
          background: transparent !important;
          width: 34px !important;
          height: 34px !important;
        }
        .maplibregl-ctrl-group button:hover {
          background: rgba(0,0,0,0.05) !important;
        }
        .maplibregl-ctrl-group button + button {
          border-top: 1px solid rgba(0,0,0,0.1) !important;
        }
        .maplibregl-ctrl-attrib {
          background: rgba(255,255,255,0.75) !important;
          color: rgba(0,0,0,0.5) !important;
          border-radius: 6px !important;
          font-size: 9px !important;
        }
        .maplibregl-ctrl-attrib a { color: rgba(0,0,0,0.6) !important; }
      `}</style>
    </div>
  );
}

// Helper to apply/remove active styling on price pin elements
function applyPinStyle(el: HTMLElement, isActive: boolean) {
  Object.assign(el.style, {
    background: isActive
      ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
      : 'rgba(255,255,255,0.95)',
    color: isActive ? 'white' : '#0f172a',
    border: `2px solid ${isActive ? '#1d4ed8' : 'rgba(0,0,0,0.12)'}`,
    borderRadius: '22px',
    padding: '5px 11px',
    fontSize: '12px',
    fontWeight: '800',
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    boxShadow: isActive
      ? '0 4px 20px rgba(59,130,246,0.6), 0 0 0 3px rgba(59,130,246,0.25)'
      : '0 2px 10px rgba(0,0,0,0.25)',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transform: isActive ? 'scale(1.15)' : 'scale(1)',
    zIndex: isActive ? '10' : '1',
    display: 'flex',
    alignItems: 'center',
    backdropFilter: 'blur(4px)',
  });
}
