import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, serverTimestamp, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import MainLayout from '../components/MainLayout';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const MaintenanceLogs = () => {
  const { role } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { settings } = useSettings();

  // Form State
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'Preventative',
    description: '',
    cost: ''
  });

  // Fetch Vehicles and Logs
  useEffect(() => {
    const vQuery = query(collection(db, "vehicles"));
    const unsubVehicles = onSnapshot(vQuery, (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const lQuery = query(collection(db, "maintenanceLogs"), orderBy("createdAt", "desc"));
    const unsubLogs = onSnapshot(lQuery, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubVehicles();
      unsubLogs();
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

    if (!formData.vehicleId || !formData.type || !formData.description || !formData.cost) {
      setError("Please fill all fields.");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

    setLoading(true);
    try {
      const logData = {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        type: formData.type,
        description: formData.description,
        cost: Number(formData.cost),
        status: "in progress",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "maintenanceLogs"), logData);
      
      const vehicleRef = doc(db, "vehicles", selectedVehicle.id);
      await updateDoc(vehicleRef, { status: "in shop" });

      setSuccess(true);
      setFormData({
        vehicleId: '',
        type: 'Preventative',
        description: '',
        cost: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error creating maintenance log:", err);
      setError("Failed to create maintenance log.");
    } finally {
      setLoading(false);
    }
  };

  const completeMaintenance = async (log) => {
    try {
      const logRef = doc(db, "maintenanceLogs", log.id);
      const vehicleRef = doc(db, "vehicles", log.vehicleId);

      await updateDoc(logRef, { 
        status: "completed",
        completedAt: serverTimestamp()
      });

      await updateDoc(vehicleRef, { status: "available" });

    } catch (err) {
      console.error("Error completing maintenance:", err);
      alert("Failed to complete maintenance.");
    }
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this maintenance record?")) return;
    try {
      await deleteDoc(doc(db, "maintenanceLogs", id));
    } catch (err) {
      console.error("Error deleting log:", err);
      alert("Failed to delete log.");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const availableVehicles = vehicles.filter(v => v.status?.toLowerCase() !== "in shop");

  return (
    <MainLayout title="Maintenance Logs" breadcrumb="Fleet / Maintenance">
      <div className="w-full max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Maintenance & Service</h1>
            <p className="text-sm font-bold text-slate-400">Track vehicle repairs and preventative service</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-8 shadow-xl">
              <h3 className="text-lg font-black text-[#2B3674] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">build</span>
                Record Service
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
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.status})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Service Type</label>
                  <select 
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    required
                  >
                    <option value="Preventative">Preventative</option>
                    <option value="Repair">Repair</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the service..."
                    rows="3"
                    className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-[#2B3674] ml-1">Cost ({settings?.currency || '₹'})</label>
                  <input 
                    type="number"
                    name="cost"
                    value={formData.cost}
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
                    <p className="text-xs font-black">Record saved!</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : 'Log Service'}
                </button>
              </form>
            </div>
          </div>

          {/* Registry */}
          <div className="lg:col-span-2">
            <div className="glass-card shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 text-xl font-black text-[#2B3674]">
                Service History
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE]">
                    <tr>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Service Details</th>
                      <th className="px-6 py-4">Cost</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.length > 0 ? logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2B3674]">{log.vehicleName}</span>
                            <span className="text-[10px] text-slate-400">ID: {log.vehicleId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-600">{log.type}</span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{log.description}</span>
                            <span className="text-[9px] text-slate-400 mt-1 uppercase font-black">Logged {log.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-[#2B3674]">{settings.currency}{log.cost}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${getStatusColor(log.status)}`}>
                            {log.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {log.status?.toLowerCase() === 'in progress' ? (
                              <button 
                                onClick={() => completeMaintenance(log)}
                                className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-xl hover:scale-105 transition-all"
                              >
                                Complete
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold italic">
                                Done ({log.completedAt?.toDate().toLocaleDateString()})
                              </span>
                            )}
                            {role === 'manager' && (
                              <button 
                                onClick={() => deleteLog(log.id)}
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
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-bold">No records found.</td>
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

export default MaintenanceLogs;
