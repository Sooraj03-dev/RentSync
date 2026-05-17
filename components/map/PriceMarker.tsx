import L from 'leaflet';

export function PriceMarker({ rent_amount }: { rent_amount: number }) {
  const formatted = `₹${rent_amount.toLocaleString('en-IN')}`;
  
  const html = `
    <div class="relative group" style="transform: translate(-50%, -100%);">
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/30 rounded-[100%] blur-[2px]"></div>
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-blue-700"></div>
      <div class="relative bg-gradient-to-b from-blue-500 to-blue-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg shadow-[0_4px_10px_rgba(37,99,235,0.4)] border border-blue-400 whitespace-nowrap text-center transform transition-transform group-hover:-translate-y-1">
        ${formatted}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-price-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}
