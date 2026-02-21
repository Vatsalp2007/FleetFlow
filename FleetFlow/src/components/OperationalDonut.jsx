import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const OperationalDonut = ({ trips = [] }) => {
  const chartData = useMemo(() => {
    const counts = {
      completed: 0,
      dispatched: 0,
      draft: 0,
      cancelled: 0
    };

    trips.forEach(trip => {
      const status = trip.status?.toLowerCase();
      if (counts.hasOwnProperty(status)) {
        counts[status] += 1;
      }
    });

    return [
      { name: 'Delivered', value: counts.completed, color: '#4318FF' },
      { name: 'In Transit', value: counts.dispatched, color: '#05CD99' },
      { name: 'Pending', value: counts.draft, color: '#FFB800' },
      { name: 'Cancelled', value: counts.cancelled, color: '#EE5D50' },
    ].filter(item => item.value > 0 || trips.length === 0);
  }, [trips]);

  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.value, 0), [chartData]);

  return (
    <div className="glass-card p-8 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-black text-[#2B3674]">Order Status</h3>
        <p className="text-xs font-bold text-slate-400 mt-1">Global shipment distribution</p>
      </div>

      <div className="flex-1 min-h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-[#2B3674]">{total.toLocaleString()}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase">Total Items</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {chartData.map((item, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] font-bold text-slate-400">{item.name}</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-sm font-black text-[#2B3674]">{item.value}</span>
               <span className="text-[10px] font-medium text-slate-400">({Math.round((item.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationalDonut;
