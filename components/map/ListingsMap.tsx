'use client';

import dynamic from 'next/dynamic';

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-slate-50 animate-pulse flex flex-col items-center justify-center text-slate-400 rounded-xl border border-slate-200">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      Loading Map...
    </div>
  )
});

export default function ListingsMap(props: { features: any[] }) {
  return <MapInner {...props} />;
}
