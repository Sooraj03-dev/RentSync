import L from 'leaflet';

export function PriceMarker({ rent_amount }: { rent_amount: number }) {
  const formatted = `₹${rent_amount.toLocaleString('en-IN')}`;
  
  const html = `
    <div class="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md border-2 border-white whitespace-nowrap text-center" style="transform: translate(-50%, -100%);">
      ${formatted}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-price-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}
