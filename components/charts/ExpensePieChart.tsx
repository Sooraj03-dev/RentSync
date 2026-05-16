"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type ExpenseData = {
  name: string;
  value: number;
};

// Colors from the design: Dark Navy, Teal, Gray, Light Gray
const COLORS = ['#0a415c', '#148092', '#8492a6', '#d3dce6'];

export function ExpensePieChart({ data }: { data: ExpenseData[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400">No data</div>;
  }

  // Calculate percentage for the first item to show in center
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const mainItem = data[0];
  const percentage = total > 0 ? Math.round((mainItem.value / total) * 100) : 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="100%"
          stroke="none"
          paddingAngle={0}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        
        {/* Center Text Customization */}
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-[#0a415c] font-extrabold text-2xl">
          {percentage}%
        </text>
        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[10px] font-bold uppercase tracking-widest">
          {mainItem.name.substring(0, 7)}.
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
