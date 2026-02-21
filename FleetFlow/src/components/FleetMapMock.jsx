import React from 'react';

const FleetMapMock = ({ vehicles = [] }) => {
  const vehiclesWithGps = vehicles.filter(v => v.lat && v.lng);

  return (
    <div className="glass-card p-8 h-full flex flex-col relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6 z-10">
        <div>
          <h3 className="text-xl font-black text-[#2B3674]">Fleet Live Map</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">Real-time GPS tracking status</p>
        </div>
        <button className="p-2.5 bg-[#F4F7FE] rounded-xl hover:bg-slate-200 transition-colors">
          <span className="material-symbols-outlined !text-lg text-slate-600">zoom_out_map</span>
        </button>
      </div>

      {/* Map Mock Visualization */}
      <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden relative min-h-[300px] flex items-center justify-center">
        {/* Simple Abstract Map Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full border-r border-b border-slate-400" style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)' }} />
          <svg className="absolute inset-0 w-full h-full">
            <path d="M0,50 Q100,150 200,50 T400,150" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M50,0 Q150,100 50,200 T150,400" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {vehiclesWithGps.length > 0 ? (
          vehiclesWithGps.map((vehicle, idx) => {
            // Map lat/lng (0-100 placeholder logic for internal mock map)
            const style = {
              top: `${vehicle.lat}%`,
              left: `${vehicle.lng}%`,
              animationDelay: `${idx * 0.2}s`
            };
            
            const getStatusColor = (status) => {
              switch (status?.toLowerCase()) {
                case 'on trip': return '#4318FF';
                case 'available': return '#05CD99';
                case 'in shop': return '#EE5D50';
                default: return '#A3AED0';
              }
            };

            return (
              <div 
                key={vehicle.id} 
                className="absolute animate-float"
                style={style}
              >
                <div className="flex flex-col items-center">
                   <div className="bg-white/90 backdrop-blur-md border border-slate-100 px-2 py-1 rounded-lg text-[9px] font-black mb-1 shadow-lg text-[#2B3674]">
                    {vehicle.name || 'Vehicle'}
                   </div>
                   <div 
                     className="w-4 h-4 rounded-full border-4 border-white shadow-xl ring-4 ring-opacity-20" 
                     style={{ backgroundColor: getStatusColor(vehicle.status), ringColor: getStatusColor(vehicle.status) }}
                   />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-4 text-slate-400 z-10 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
               <span className="material-symbols-outlined !text-3xl">map</span>
            </div>
            <div>
              <p className="text-sm font-black text-[#2B3674]">No Live GPS Data Available</p>
              <p className="text-xs font-bold text-slate-400 mt-1 max-w-[200px]">Vehicles must be assigned latitude and longitude coordinates to appear on the map.</p>
            </div>
          </div>
        )}

        {/* HUD Elements */}
        {vehiclesWithGps.length > 0 && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
              <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase block leading-none">Scanning Fleet</span>
                  <span className="text-sm font-black text-[#2B3674]">{vehiclesWithGps.length} Active Node(s)</span>
              </div>
          </div>
        )}
      </div>

      {/* Basic Status Legend */}
      <div className="mt-6 flex flex-wrap gap-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Transit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#05CD99]" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EE5D50]" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Maintenance</span>
        </div>
      </div>
    </div>
  );
};

export default FleetMapMock;
