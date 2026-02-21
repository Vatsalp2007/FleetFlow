import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useSettings } from "../context/SettingsContext";
import { formatLabel } from "../utils/utils";
import MainLayout from '../components/MainLayout';
import { useAuth } from "../context/AuthContext";

const DriverProfiles = () => {
  const { role } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { settings } = useSettings();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseExpiry: '',
    category: 'truck',
    status: 'available'
  });

  // Fetch Drivers and Trips
  useEffect(() => {
    const unsubDrivers = onSnapshot(query(collection(db, "drivers"), orderBy("createdAt", "desc")), (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTrips = onSnapshot(collection(db, "trips"), (snap) => {
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubDrivers();
      unsubTrips();
    };
  }, []);

  // Auto-suspend check
  useEffect(() => {
    if (settings.blockExpiredLicense && drivers.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      drivers.forEach(async (d) => {
        if (d.licenseExpiry < today && d.status?.toLowerCase() !== 'suspended') {
          try {
            await updateDoc(doc(db, "drivers", d.id), { status: 'suspended' });
          } catch (err) {
            console.error("Auto-suspension failed for", d.name, err);
          }
        }
      });
    }
  }, [drivers, settings.blockExpiredLicense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name || !formData.licenseNumber || !formData.licenseExpiry) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        category: formData.category.trim().toLowerCase(),
        status: formData.status.trim().toLowerCase(),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "drivers", editingId), dataToSave);
        setSuccess("Driver updated successfully!");
      } else {
        await addDoc(collection(db, "drivers"), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
        setSuccess("Driver added successfully!");
      }

      setFormData({
        name: '',
        licenseNumber: '',
        licenseExpiry: '',
        category: 'truck',
        status: 'available'
      });
      setEditingId(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving driver:", err);
      setError("Failed to save driver.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingId(driver.id);
    setFormData({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      category: driver.category || 'truck',
      status: driver.status
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "drivers", id));
    } catch (err) {
      console.error("Error deleting driver:", err);
    }
  };

  const driverPerformance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return drivers.map(d => {
      const driverTrips = trips.filter(t => t.driverId === d.id);
      const totalTrips = driverTrips.length;
      const completedTrips = driverTrips.filter(t => t.status?.toLowerCase() === 'completed').length;
      const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
      const isExpired = d.licenseExpiry < today;
      return { ...d, totalTrips, completionRate, isExpired };
    });
  }, [drivers, trips]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'on duty': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <MainLayout title="Driver Profiles" breadcrumb="Fleet / Drivers">
      <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Driver Performance & safety</h1>
            <p className="text-sm font-bold text-slate-400">Manage registry and compliance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {role === 'manager' && (
            <div className="lg:col-span-1">
              <div className="glass-card p-8 shadow-xl">
                <h3 className="text-lg font-black text-[#2B3674] mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    {editingId ? 'edit_note' : 'person_add'}
                  </span>
                  {editingId ? 'Edit Driver' : 'Register Driver'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Full Name</label>
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">License Number</label>
                    <input 
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Expiry Date</label>
                    <input 
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    >
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                      <option value="bike">Bike</option>
                    </select>
                  </div>

                  {editingId && (
                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#2B3674] ml-1">Status</label>
                      <select 
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                      >
                        <option value="available">Available</option>
                        <option value="on duty">On Duty</option>
                        <option value="off duty">Off Duty</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  )}

                  {error && <p className="text-xs font-black text-red-500">{error}</p>}
                  {success && <p className="text-xs font-black text-green-500">{success}</p>}

                  <div className="flex gap-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {loading ? '...' : (editingId ? 'Update' : 'Save')}
                    </button>
                    {editingId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setFormData({ name: '', licenseNumber: '', licenseExpiry: '', category: 'truck', status: 'available' });
                        }}
                        className="px-6 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm"
                      >
                        X
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className={role === 'manager' ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="glass-card shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 text-xl font-black text-[#2B3674]">
                Driver Registry
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE]">
                    <tr>
                      <th className="px-6 py-4">Driver Info</th>
                      <th className="px-6 py-4">Compliance</th>
                      <th className="px-6 py-4 text-center">Efficiency</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      {role === 'manager' && <th className="px-6 py-4 text-center">Manage</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driverPerformance.map((driver) => (
                      <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2B3674]">{driver.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{formatLabel(driver.category)} • {driver.licenseNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border w-fit ${driver.isExpired ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                              {driver.isExpired ? 'EXPIRED' : 'VALID'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 font-bold">Exp: {driver.licenseExpiry}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[#2B3674] font-black">{driver.completionRate}%</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{driver.totalTrips} Trips</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${getStatusColor(driver.status)}`}>
                            {driver.status?.toUpperCase()}
                          </span>
                        </td>
                        {role === 'manager' && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleEdit(driver)} className="p-1.5 text-slate-400 hover:text-primary"><span className="material-symbols-outlined !text-lg">edit</span></button>
                              <button onClick={() => handleDelete(driver.id)} className="p-1.5 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined !text-lg">delete</span></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
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

export default DriverProfiles;
