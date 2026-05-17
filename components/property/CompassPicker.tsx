'use client';

import { cn } from '@/lib/utils';
import { Home } from 'lucide-react';

type Direction = 'north' | 'south' | 'east' | 'west';

interface CompassPickerProps {
  value?: Direction;
  onChange: (value: Direction) => void;
}

export function CompassPicker({ value, onChange }: CompassPickerProps) {
  const directions: { dir: Direction; label: string; row: number; col: number }[] = [
    { dir: 'north', label: 'N', row: 1, col: 2 },
    { dir: 'west',  label: 'W', row: 2, col: 1 },
    { dir: 'east',  label: 'E', row: 2, col: 3 },
    { dir: 'south', label: 'S', row: 3, col: 2 },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-48 h-48 p-4 bg-slate-50 rounded-full border border-slate-200 shadow-inner">
        {/* Center icon */}
        <div className="col-start-2 row-start-2 flex items-center justify-center">
          <Home className="w-6 h-6 text-slate-300" />
        </div>

        {directions.map(({ dir, label, row, col }) => {
          const isSelected = value === dir;
          return (
            <button
              key={dir}
              type="button"
              onClick={() => onChange(dir)}
              className={cn(
                "col-start-" + col + " row-start-" + row,
                "flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all shadow-sm mx-auto my-auto",
                isSelected
                  ? "bg-blue-50 text-blue-600 ring-2 ring-blue-500 scale-110"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:scale-105"
              )}
              style={{ gridColumnStart: col, gridRowStart: row }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500 font-medium">Select main door facing</p>
    </div>
  );
}
