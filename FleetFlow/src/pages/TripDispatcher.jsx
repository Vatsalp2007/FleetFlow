import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, serverTimestamp, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSettings } from "../context/SettingsContext";
import { formatLabel } from "../utils/utils";
import MainLayout from '../components/MainLayout';
import { useAuth } from '../context/AuthContext';

const TripDispatcher = () => {
  const { role } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { settings } = useSettings();

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    freightAmount: '',
    fromLocation: '',
    toLocation: ''
  });

  // Fetch Available Vehicles and Drivers
  useEffect(() => {
    const vQuery = query(collection(db, "vehicles"));
    const unsubVehicles = onSnapshot(vQuery, (snap) => {
      const allVehicles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVehicles(allVehicles.filter(v => {
        const status = (v.status || 'available').toLowerCase();
        if (status === 'available') return true;
        if (status === 'in shop') return !settings.requireMaintenance;
        return false;
      }));
    });

    const dQuery = query(collection(db, "drivers"));
    const unsubDrivers = onSnapshot(dQuery, (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const tQuery = query(collection(db, "trips"), orderBy("createdAt", "desc"));
    const unsubTrips = onSnapshot(tQuery, (snap) => {
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
        console.error("Trips listener error:", err);
    });

    return () => {
      unsubVehicles();
      unsubDrivers();
      unsubTrips();
    };
  }, [settings.requireMaintenance]);

  const availableDrivers = useMemo(() => {
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!selectedVehicle) return [];

    return drivers.filter(driver =>
      driver.status === "available" &&
      driver.category?.toLowerCase() === selectedVehicle?.type?.toLowerCase()
    );
  }, [drivers, formData.vehicleId, vehicles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'cargoWeight' && settings.ratePerKg > 0) {
        newState.freightAmount = (Number(value) * settings.ratePerKg).toFixed(2);
      }
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.vehicleId || !formData.cargoWeight || !formData.fromLocation || !formData.toLocation) {
      setError("Please fill all mission-critical fields.");
      return;
    }

    if (settings.requireDriver && !formData.driverId) {
      setError("Operational Rule: Driver assignment is required.");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    const selectedDriver = drivers.find(d => d.id === formData.driverId);

    if (!selectedVehicle) {
      setError("Selected vehicle not found.");
      return;
    }

    if (settings.preventOverload && Number(formData.cargoWeight) > selectedVehicle.capacity) {
      setError(`Overload Blocked: Cargo (${formData.cargoWeight}kg) exceeds vehicle capacity (${selectedVehicle.capacity}kg).`);
      return;
    }

    setLoading(true);
    try {
      const tripData = {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        driverId: selectedDriver?.id || null,
        driverName: selectedDriver?.name || 'Unassigned',
        cargoWeight: Number(formData.cargoWeight),
        freightAmount: Number(formData.freightAmount),
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        status: "draft",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "trips"), tripData);
      
      if (selectedDriver) {
        const driverRef = doc(db, "drivers", selectedDriver.id);
        await updateDoc(driverRef, { status: "on duty" });
      }

      setSuccess(true);
      setFormData({
        vehicleId: '',
        driverId: '',
        cargoWeight: '',
        freightAmount: '',
        fromLocation: '',
        toLocation: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error creating trip:", err);
      setError("Failed to create trip.");
    } finally {
      setLoading(false);
    }
  };

  const updateTripStatus = async (trip, nextStatus) => {
    if (nextStatus === "cancelled") {
      if (!window.confirm("Are you sure you want to cancel this trip? This will release the vehicle and driver.")) {
        return;
      }
    }

    try {
      const tripRef = doc(db, "trips", trip.id);
      const vehicleRef = doc(db, "vehicles", trip.vehicleId);
      
      let vStatus = "available";
      let dStatus = "available";

      if (nextStatus === "dispatched") {
        vStatus = "on trip";
        dStatus = "on duty";
      }

      if (nextStatus === "completed" || nextStatus === "cancelled") {
        if (!settings.autoResetDriver) {
          dStatus = "off duty";
        }
      }

      await updateDoc(tripRef, { status: nextStatus });
      await updateDoc(vehicleRef, { status: vStatus });
      
      if (trip.driverId) {
        const driverRef = doc(db, "drivers", trip.driverId);
        await updateDoc(driverRef, { status: dStatus });
      }

    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const deleteTrip = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trip record?")) return;
    try {
      await deleteDoc(doc(db, "trips", id));
    } catch (err) {
      console.error("Error deleting trip:", err);
      alert("Failed to delete trip.");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'dispatched': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <MainLayout title="Trip Dispatcher" breadcrumb="Operations / Dispatch">
      <div className="w-full max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Trip Dispatcher</h1>
            <p className="text-sm font-bold text-slate-400">Plan and dispatch fleet assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dispatch Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-8 shadow-xl">
              <h3 className="text-lg font-black text-[#2B3674] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">assignment_add</span>
                Create Trip
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Available Vehicle</label>
                  <select 
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    required
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({formatLabel(v.type)})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Available Driver</label>
                  <select 
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    required={settings.requireDriver}
                  >
                    <option value="">Select a driver</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({formatLabel(d.category)})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Weight (kg)</label>
                    <input 
                      type="number"
                      name="cargoWeight"
                      value={formData.cargoWeight}
                      onChange={handleChange}
                      placeholder="5000"
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Freight ({settings?.currency || '₹'})</label>
                    <input 
                      type="number"
                      name="freightAmount"
                      value={formData.freightAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">From</label>
                    <input 
                      type="text"
                      name="fromLocation"
                      value={formData.fromLocation}
                      onChange={handleChange}
                      placeholder="Origin"
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">To</label>
                    <input 
                      type="text"
                      name="toLocation"
                      value={formData.toLocation}
                      onChange={handleChange}
                      placeholder="Destination"
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>
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
                    <p className="text-xs font-black">Trip created successfully!</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined !text-lg">add_task</span>
                      Dispatch Trip
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Registry Table */}
          <div className="lg:col-span-2">
            <div className="glass-card shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-black text-[#2B3674] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  Trip Registry
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE]">
                    <tr>
                      <th className="px-6 py-4">Route</th>
                      <th className="px-6 py-4">Vehicle & Driver</th>
                      <th className="px-6 py-4">Cargo</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trips.length > 0 ? trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2B3674]">{trip.fromLocation} → {trip.toLocation}</span>
                            <span className="text-[10px] text-slate-400">{trip.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-600">🚛 {trip.vehicleName}</span>
                            <span className="text-[10px] text-slate-400 ml-5 font-bold">👤 {trip.driverName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-[#2B3674]">{trip.cargoWeight}kg</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${getStatusColor(trip.status)}`}>
                            {trip.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {trip.status?.toLowerCase() === 'draft' && (
                              <>
                                <button 
                                  onClick={() => updateTripStatus(trip, "dispatched")}
                                  className="px-3 py-1.5 bg-primary text-white text-[10px] font-black rounded-xl hover:scale-105 transition-all"
                                >
                                  Dispatch
                                </button>
                                <button 
                                  onClick={() => updateTripStatus(trip, "cancelled")}
                                  className="px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-black rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {trip.status?.toLowerCase() === 'dispatched' && (
                              <>
                                <button 
                                  onClick={() => updateTripStatus(trip, "completed")}
                                  className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-xl hover:scale-105 transition-all"
                                >
                                  Complete
                                </button>
                                <button 
                                  onClick={() => updateTripStatus(trip, "cancelled")}
                                  className="px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-black rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {(trip.status?.toLowerCase() === 'completed' || trip.status?.toLowerCase() === 'cancelled') && (
                              <span className="text-[10px] text-slate-400 font-bold italic">Closed</span>
                            )}
                            {role === 'manager' && (
                                <button 
                                    onClick={() => deleteTrip(trip.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined !text-lg">delete</span>
                                </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-bold">No trips registered.</td>
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

export default TripDispatcher;
