import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import MainLayout from '../components/MainLayout';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const ExpenseAndFuelLogs = () => {
  const { role } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { settings } = useSettings();

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch all necessary data
  useEffect(() => {
    const unsubVehicles = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFuel = onSnapshot(query(collection(db, "fuelLogs"), orderBy("createdAt", "desc")), (snap) => {
      setFuelLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMaint = onSnapshot(collection(db, "maintenanceLogs"), (snap) => {
      setMaintenanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qTrips = query(collection(db, "trips"), where("status", "==", "completed"));
    const unsubTrips = onSnapshot(qTrips, (snap) => {
      setCompletedTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubVehicles();
      unsubFuel();
      unsubMaint();
      unsubTrips();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.vehicleId || !formData.liters || !formData.cost || !formData.date) {
      setError("Please fill all fields.");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

    setLoading(true);
    try {
      const fuelData = {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        liters: Number(formData.liters),
        cost: Number(formData.cost),
        date: formData.date,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "fuelLogs"), fuelData);
      setSuccess(true);
      setFormData({
        vehicleId: '',
        liters: '',
        cost: '',
        date: new Date().toISOString().split('T')[0]
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error logging fuel:", err);
      setError("Failed to log fuel entry.");
    } finally {
      setLoading(false);
    }
  };

  const deleteFuelLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fuel log?")) return;
    try {
      await deleteDoc(doc(db, "fuelLogs", id));
    } catch (err) {
      console.error("Error deleting fuel log:", err);
      alert("Failed to delete fuel log.");
    }
  };

  const operationalCosts = useMemo(() => {
    return vehicles.map(v => {
      const vFuelCost = fuelLogs
        .filter(f => f.vehicleId === v.id)
        .reduce((sum, current) => sum + (current.cost || 0), 0);

      const vMaintCost = maintenanceLogs
        .filter(m => m.vehicleId === v.id)
        .reduce((sum, current) => sum + (current.cost || 0), 0);

      return {
        id: v.id,
        name: v.name,
        fuelCost: vFuelCost,
        maintenanceCost: vMaintCost,
        totalCost: vFuelCost + vMaintCost
      };
    });
  }, [vehicles, fuelLogs, maintenanceLogs]);

  return (
    <MainLayout title="Expenses & Fuel" breadcrumb="Operations / Analytics">
      <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Expense & Fuel Analytics</h1>
            <p className="text-sm font-bold text-slate-400">Monitor fuel consumption and operational costs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fuel Entry Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-8 shadow-xl">
              <h3 className="text-lg font-black text-[#2B3674] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">local_gas_station</span>
                Record Fuel Entry
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Vehicle</label>
                  <select 
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    required
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Liters</label>
                    <input 
                      type="number"
                      name="liters"
                      value={formData.liters}
                      onChange={handleChange}
                      placeholder="50"
                      step="0.01"
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Total Cost ({settings?.currency || '₹'})</label>
                    <input 
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Date</label>
                  <input 
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-500 rounded-2xl border border-red-100 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-xl">error</span>
                    <p className="text-xs font-black">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-xl">check_circle</span>
                    <p className="text-xs font-black">Logged successfully!</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : 'Record Fuel Entry'}
                </button>
              </form>
            </div>
          </div>

          {/* Registry & Summary */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 text-xl font-black text-[#2B3674]">
                Operational Cost Summary
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE]">
                    <tr>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4 text-right">Fuel Cost</th>
                      <th className="px-6 py-4 text-right">Maint. Cost</th>
                      <th className="px-6 py-4 text-right bg-primary/5 text-primary">Total Op. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {operationalCosts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-[#2B3674]">{item.name}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">{settings?.currency}{item.fuelCost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">{settings?.currency}{item.maintenanceCost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black text-primary bg-primary/5">{settings?.currency}{item.totalCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 text-xl font-black text-[#2B3674]">
                Completed Trips
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE]">
                    <tr>
                      <th className="px-6 py-4">Route</th>
                      <th className="px-6 py-4">Vehicle & Driver</th>
                      <th className="px-6 py-4">Weight</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedTrips.length > 0 ? completedTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-[#2B3674]">{trip.fromLocation} → {trip.toLocation}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-600">🚛 {trip.vehicleName}</span>
                            <span className="text-[10px] text-slate-400 font-bold">👤 {trip.driverName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-[#2B3674]">{trip.cargoWeight}kg</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 text-[10px] font-black bg-green-100 text-green-700 rounded-full border border-green-200">
                            COMPLETED
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-bold">No completed trips.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExpenseAndFuelLogs;
