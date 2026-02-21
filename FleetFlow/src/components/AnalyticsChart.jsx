import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AnalyticsChart = ({ trips = [] }) => {
  const [timeRange, setTimeRange] = useState('Weekly');

  // Generate chart data from real trips
  const chartData = useMemo(() => {
    if (!trips.length) return [];

    const days = timeRange === 'Weekly' ? 7 : 30;
    const dataMap = {};
    
    // Initialize days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      dataMap[dateStr] = { name: dateStr, delivered: 0, delayed: 0 };
    }

    trips.forEach(trip => {
      const tripDate = trip.createdAt?.toDate ? trip.createdAt.toDate() : new Date(trip.createdAt);
      const dateStr = tripDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      if (dataMap[dateStr]) {
        if (trip.status?.toLowerCase() === 'completed') {
          dataMap[dateStr].delivered += 1;
        } else if (trip.status?.toLowerCase() === 'delayed' || trip.status?.toLowerCase() === 'cancelled') {
          dataMap[dateStr].delayed += 1;
        }
      }
    });

    return Object.values(dataMap);
  }, [trips, timeRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl border border-slate-100 rounded-2xl">
          <p className="text-xs font-black text-slate-400 mb-2 uppercase">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm font-bold text-[#2B3674]">{entry.name}:</span>
              <span className="text-sm font-black text-[#2B3674]">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-[#2B3674]">Delivery Performance</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">Real-time trip completion vs delays</p>
        </div>
        <div className="flex bg-[#F4F7FE] p-1 rounded-xl">
          {['Weekly', 'Monthly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                timeRange === range ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4318FF" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDelayed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#05CD99" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#05CD99" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#A3AED0', fontSize: 12, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#A3AED0', fontSize: 12, fontWeight: 700 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4318FF', strokeWidth: 1, strokeDasharray: '5 5' }} />
            <Area 
              type="monotone" 
              dataKey="delivered" 
              name="Delivered"
              stroke="#4318FF" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorDelivered)" 
            />
            <Area 
              type="monotone" 
              dataKey="delayed" 
              name="Delayed"
              stroke="#05CD99" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorDelayed)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
