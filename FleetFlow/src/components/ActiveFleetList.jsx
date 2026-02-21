import React from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from '../context/AuthContext';
import { formatLabel } from '../utils/utils';

const ActiveFleetList = ({ vehicles = [] }) => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const activeVehicles = vehicles.filter(v => v.status?.toLowerCase() !== 'in shop');

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteDoc(doc(db, "vehicles", id));
      } catch (err) {
        console.error("Error deleting vehicle:", err);
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'on trip':
      case 'dispatched':
        return 'bg-blue-50 text-primary border-blue-100 shadow-blue-100/50 hover:bg-blue-100';
      case 'delayed':
        return 'bg-amber-50 text-amber-500 border-amber-100 shadow-amber-100/50 hover:bg-amber-100';
      default:
        return 'bg-green-50 text-green-500 border-green-100 shadow-green-100/50 hover:bg-green-100';
    }
  };

  const getStatusLabel = (status) => {
    if (status?.toLowerCase() === 'on trip') return 'In Transit';
    if (status?.toLowerCase() === 'dispatched') return 'Dispatched';
    return status?.charAt(0).toUpperCase() + status?.slice(1);
  };

  return (
    <div className="glass-card p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-[#2B3674]">Active Fleet</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">Operational status of assigned vehicles</p>
        </div>
        <button className="text-xs font-black text-primary hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {activeVehicles.slice(0, 5).map((vehicle) => {
          const loadPercentage = Math.min(100, Math.round(((vehicle.currentLoad || 0) / (vehicle.capacity || 1)) * 100));
          
          return (
            <div key={vehicle.id} className="group p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-[#F4F7FE]/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-slate-400">local_shipping</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[#2B3674]">{vehicle.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{vehicle.licensePlate} • {formatLabel(vehicle.type)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`status-badge ${getStatusStyle(vehicle.status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {getStatusLabel(vehicle.status || 'available')}
                  </div>
                  {role === 'manager' && (
                    <div className="flex items-center gap-1 ml-2 border-l border-slate-100 pl-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/edit-vehicle/${vehicle.id}`); }}
                        className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-[18px]">edit</span>
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, vehicle.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined !text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar for Load */}
              <div className="mt-2">
                <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-tighter">
                  <span>Current Load</span>
                  <span>{loadPercentage}% Capacity</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${loadPercentage > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {vehicles.length === 0 && (
          <div className="py-12 flex flex-col items-center text-slate-400">
             <span className="material-symbols-outlined !text-4xl mb-2">inventory_2</span>
             <p className="text-sm font-bold">No active vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveFleetList;
