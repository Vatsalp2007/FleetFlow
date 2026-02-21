import React from 'react';

const KPICard = ({ title, description, value, badgeColor, showProgress, progressValue }) => {
  // Determine gradient and text colors based on badgeColor
  const colorMap = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
  };

  const badgeClass = colorMap[badgeColor] || "bg-gray-100 text-gray-800";
  const progressColor = badgeColor === 'blue' ? 'bg-blue-500' : 'bg-gray-500';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          {badgeColor === 'green' && '●'}
          {badgeColor === 'red' && '▲'}
          {badgeColor === 'blue' && '📈'}
          {badgeColor === 'yellow' && '⏱'}
        </span>
      </div>
      
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>

      {showProgress && (
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${progressColor} h-2 rounded-full`}
            style={{ width: `${progressValue}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default KPICard;
