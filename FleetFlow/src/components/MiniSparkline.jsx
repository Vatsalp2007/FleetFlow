import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const MiniSparkline = ({ data, color }) => {
  // Sample trend data if none provided
  const plotData = data || [
    { v: 30 }, { v: 40 }, { v: 35 }, { v: 50 }, { v: 45 }, { v: 60 }, { v: 55 }
  ];

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={plotData}>
          <Line 
            type="monotone" 
            dataKey="v" 
            stroke={color || "#4318FF"} 
            strokeWidth={2} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniSparkline;
