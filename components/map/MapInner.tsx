'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { PriceMarker } from './PriceMarker';
import { Phone, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet.offline';

export default function MapInner({ features }: { features: any[] }) {
  const [position, setPosition] = useState<[number, number]>([12.9716, 77.5946]); // Default Bengaluru
  const [caching, setCaching] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const MapUpdater = ({ pos }: { pos: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(pos, map.getZoom());
    }, [pos, map]);
    return null;
  };

  // Custom component to handle offline layer
  const OfflineLayer = () => {
    const map = useMap();
    useEffect(() => {
      // Create the offline tile layer
      const LAny = L as any;
      const tileLayerOffline = LAny.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        className: 'map-tiles-3d'
      }).addTo(map);

      // Add a control to save tiles
      const control = LAny.control.savetiles(tileLayerOffline, {
        zoomlevels: [10, 11, 12, 13, 14],
        confirm: (info: any, savecb: any) => {
          if (confirm(`Save ${info._tilesforSave.length} tiles for offline use?`)) savecb();
        },
        confirmRemoval: (info: any, removecb: any) => {
          if (confirm(`Remove saved tiles?`)) removecb();
        },
        saveText: '<i class="lucide-download"></i> Save for offline',
        rmText: '<i class="lucide-trash"></i> Delete offline tiles'
      });
      
      control.addTo(map);
      
      return () => {
        map.removeControl(control);
        map.removeLayer(tileLayerOffline);
      };
    }, [map]);
    return null;
  };

    const pulseIcon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="relative flex h-5 w-5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-5 w-5 bg-red-600 border-2 border-white shadow-sm"></span>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

  return (
    <MapContainer center={position} zoom={12} scrollWheelZoom={true} className="w-full h-full z-0 relative rounded-xl border border-slate-200 shadow-sm">
      <MapUpdater pos={position} />
      <OfflineLayer />
      <Marker position={position} icon={pulseIcon} zIndexOffset={1000}>
        <Popup className="rounded-xl overflow-hidden font-bold text-slate-800 text-center py-1">
          You are here
        </Popup>
      </Marker>
      <MarkerClusterGroup chunkedLoading>
        {features.map((feature) => {
          const { coordinates } = feature.geometry;
          const { id, unit_number, rent_amount, amenities, contact_wa } = feature.properties;
          
          return (
            <Marker 
              key={id} 
              position={[coordinates[1], coordinates[0]]} 
              icon={PriceMarker({ rent_amount })}
            >
              <Popup className="rounded-xl overflow-hidden min-w-[200px]">
                <div className="flex flex-col gap-2">
                  <div className="font-bold text-slate-900 flex justify-between items-center text-sm">
                    <span>{unit_number}</span>
                    <span className="text-blue-600">₹{rent_amount.toLocaleString('en-IN')}</span>
                  </div>
                  {amenities && amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {amenities.map((a: string) => (
                        <span key={a} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Link href={`/listings/${id}`} className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                      Details
                    </Link>
                    {contact_wa && (
                      <a href={`https://wa.me/${contact_wa}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-1.5 rounded-lg text-xs font-semibold transition-colors">
                        <Phone className="w-3 h-3" /> Chat
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
