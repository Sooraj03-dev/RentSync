'use client';

import { formatCurrency } from '@/lib/utils';
import { Home, Users, Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface PricingComparisonProps {
  rentPrice?: number | null;
  pgSharing?: number | null;
  pgSingle?: number | null;
  maintenance?: number | null;
  electricityFixed?: number | null;
  waterFixed?: number | null;
  deposit?: number | null;
  bhk?: number | null;
  contactWa?: string | null;
}

export function PricingComparison(props: PricingComparisonProps) {
  const {
    rentPrice = 0, pgSharing = 0, pgSingle = 0,
    maintenance = 0, electricityFixed = 0, waterFixed = 0,
    deposit = 0, bhk = 1, contactWa
  } = props;

  const hasRent = !!rentPrice && rentPrice > 0;
  const hasPg = (!!pgSharing && pgSharing > 0) || (!!pgSingle && pgSingle > 0);

  const extras = (maintenance || 0) + (electricityFixed || 0) + (waterFixed || 0);
  const totalRent = (rentPrice || 0) + extras;
  
  const estimatedPgDeposit = deposit || ((pgSingle || pgSharing || 0) * 1);

  const rentBestFor = (bhk || 1) >= 2 ? "Families & professionals" : "Singles & couples";
  const pgBestFor = "Students & working singles";

  const waLink = contactWa ? `https://wa.me/${contactWa}` : '#';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
        
        {/* Whole House Option */}
        {hasRent && (
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <Home className="w-5 h-5" />
              <h3 className="font-bold">Whole-house rental</h3>
            </div>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-slate-900">{formatCurrency(rentPrice || 0)}</span>
              <span className="text-slate-500 text-sm"> / month</span>
            </div>

            <div className="space-y-2 mb-6 flex-1 text-sm text-slate-600">
              {maintenance! > 0 && <p className="flex justify-between"><span>+ Maintenance</span> <span>{formatCurrency(maintenance!)}</span></p>}
              {electricityFixed! > 0 && <p className="flex justify-between"><span>+ Electricity (Fixed)</span> <span>{formatCurrency(electricityFixed!)}</span></p>}
              {waterFixed! > 0 && <p className="flex justify-between"><span>+ Water (Fixed)</span> <span>{formatCurrency(waterFixed!)}</span></p>}
              
              <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                <span>Est. Total</span>
                <span>{formatCurrency(totalRent)}/mo</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>Yearly estimate</span>
                <span className="font-semibold text-blue-600">{formatCurrency(totalRent * 12)}/yr</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-slate-800">Deposit: {formatCurrency(deposit || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Best for: {rentBestFor}</p>
            </div>

            {contactWa && (
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-auto w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 font-semibold py-2.5 rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4" /> Enquire on WhatsApp
              </a>
            )}
          </div>
        )}

        {/* PG Option */}
        {hasPg && (
          <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Popular
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-purple-700">
              <Users className="w-5 h-5" />
              <h3 className="font-bold">PG / Hostel</h3>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              {pgSharing! > 0 && (
                <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <span className="text-sm font-semibold text-purple-900">Sharing</span>
                  <span className="font-bold text-purple-700">{formatCurrency(pgSharing!)}<span className="text-xs font-normal">/mo</span></span>
                </div>
              )}
              {pgSingle! > 0 && (
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Single</span>
                  <span className="font-bold text-slate-900">{formatCurrency(pgSingle!)}<span className="text-xs font-normal">/mo</span></span>
                </div>
              )}
              <div className="pt-2 text-sm text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Utilities often included</p>
                <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Maintenance included</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-slate-800">Deposit: {formatCurrency(estimatedPgDeposit)} <span className="text-xs text-slate-400 font-normal">(est)</span></p>
              <p className="text-xs text-slate-500 mt-1">Best for: {pgBestFor}</p>
            </div>

            {contactWa && (
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-auto w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 font-semibold py-2.5 rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4" /> Enquire on WhatsApp
              </a>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
