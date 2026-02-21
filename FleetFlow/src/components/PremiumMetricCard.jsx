import React, { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import MiniSparkline from './MiniSparkline';

const PremiumMetricCard = ({ title, value, subtext, trend, trendValue, icon, color, sparklineData }) => {
  const { settings } = useSettings();
  const [count, setCount] = useState(0);

  // Animated counter logic
  useEffect(() => {
    const isCurrency = typeof value === 'string' && value.includes(settings?.currency || '$');
    const isPercentage = typeof value === 'string' && value.endsWith('%');
    
    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) 
      : value;

    if (isNaN(numericValue)) {
      setCount(value);
      return;
    }

    let start = 0;
    const end = numericValue;
    const duration = 1000;
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 20);
      if (start >= end) {
        setCount(value);
        clearInterval(timer);
      } else {
        const prefix = isCurrency ? (settings?.currency || '$') : '';
        const suffix = isPercentage ? '%' : '';
        setCount(`${prefix}${start.toLocaleString()}${suffix}`);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value, settings?.currency]);

  const colorClasses = {
    blue: 'bg-blue-50 text-primary',
    green: 'bg-green-50 text-green-500',
    red: 'bg-red-50 text-red-500',
    yellow: 'bg-amber-50 text-amber-500',
    purple: 'bg-purple-50 text-purple-500',
  };

  return (
    <div className="glass-card p-6 flex flex-col group overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${colorClasses[color] || colorClasses.blue}`}>
          <span className="material-symbols-outlined !text-2xl">{icon}</span>
        </div>
        <div className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          <span className="material-symbols-outlined !text-[12px] mr-1">
            {trend === 'up' ? 'trending_up' : 'trending_down'}
          </span>
          {trendValue}
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider truncate">{title}</span>
        <h3 className="text-2xl font-black text-[#2B3674] tracking-tight truncate">{count}</h3>
        <p className="text-[11px] font-medium text-slate-400 mt-2 truncate">{subtext}</p>
      </div>
    </div>
  );
};

export default PremiumMetricCard;
