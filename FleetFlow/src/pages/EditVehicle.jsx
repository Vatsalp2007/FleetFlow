import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import MainLayout from '../components/MainLayout';

const EditVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    licensePlate: '',
    type: '',
    maxLoad: '',
    odometer: '',
    region: '',
    outOfService: false
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const docRef = doc(db, "vehicles", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || '',
            model: data.model || '',
            licensePlate: data.licensePlate || '',
            type: data.type || '',
            maxLoad: data.capacity || '',
            odometer: data.odometer || '',
            region: data.region || '',
            outOfService: data.status?.toLowerCase() === "out of service"
          });
        } else {
          setError("Vehicle not found.");
        }
      } catch (err) {
        console.error("Error fetching vehicle:", err);
        setError("Failed to load vehicle data.");
      } finally {
        setFetching(false);
      }
    };
    fetchVehicle();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.model || !formData.licensePlate || !formData.type || !formData.maxLoad || !formData.odometer || !formData.region) {
      setError("Please fill out all required fields.");
      return;
    }

    if (Number(formData.maxLoad) <= 0) {
      setError("Max Load capacity must be a positive number.");
      return;
    }

    if (Number(formData.odometer) < 0) {
      setError("Odometer cannot be a negative number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const licenseQuery = query(
        collection(db, "vehicles"), 
        where("licensePlate", "==", formData.licensePlate.toUpperCase())
      );
      const licenseSnapshot = await getDocs(licenseQuery);
      
      const duplicateExists = licenseSnapshot.docs.some(docSnap => docSnap.id !== id);

      if (duplicateExists) {
        setError("License Plate already exists.");
        setLoading(false);
        return;
      }

      const vehicleData = {
        name: formData.name,
        model: formData.model,
        licensePlate: formData.licensePlate.toUpperCase(),
        type: formData.type.trim().toLowerCase(),
        capacity: Number(formData.maxLoad),
        odometer: Number(formData.odometer),
        region: formData.region,
        status: formData.outOfService ? "out of service" : "available",
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, "vehicles", id), vehicleData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error("Error updating vehicle: ", err);
      setError("Failed to update vehicle. Please try again.");
    } finally {
      if(!success) setLoading(false);
    }
  };

  return (
    <MainLayout title="Edit Vehicle" breadcrumb="Fleet / Edit">
      <div className="w-full max-w-[800px] mx-auto space-y-8 pb-20">
        
        <div className="flex items-center gap-4 mb-2">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-primary transition-all active:scale-90"
          >
            <span className="material-symbols-outlined !text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Edit Vehicle</h1>
            <p className="text-sm font-bold text-slate-400">Update asset information</p>
          </div>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center py-20 text-slate-500">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
            <span className="ml-3 font-medium text-[#2B3674]">Loading vehicle details...</span>
          </div>
        ) : (
          <div className="glass-card shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Identity Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#2B3674] uppercase tracking-wider">Identity Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Vehicle Name *</label>
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                      placeholder="e.g. Delivery Van 04" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Model / Make *</label>
                    <input 
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                      placeholder="e.g. Ford Transit Custom" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">License Plate *</label>
                    <input 
                      type="text"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none uppercase" 
                      placeholder="ABC-1234" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Vehicle Type *</label>
                    <select 
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="Bike">Bike</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Specifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#2B3674] uppercase tracking-wider">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Load Capacity (kg) *</label>
                    <input 
                      type="number"
                      name="maxLoad"
                      value={formData.maxLoad}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                      placeholder="0" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Odometer Reading (km) *</label>
                    <input 
                      type="number"
                      name="odometer"
                      value={formData.odometer}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                      placeholder="0" 
                      required
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Logistics */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#2B3674] uppercase tracking-wider">Logistics & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-[#2B3674] ml-1">Operating Region *</label>
                    <select 
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                      required
                    >
                      <option value="">Select region</option>
                      <option value="North">North Sector</option>
                      <option value="South">South Sector</option>
                      <option value="East">East Sector</option>
                      <option value="West">West Sector</option>
                      <option value="Central">Central Hub</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#F4F7FE] rounded-2xl border border-primary/10 self-end">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#2B3674]">Out of Service</span>
                      <span className="text-[10px] font-bold text-slate-400">Mark as unavailable</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="outOfService"
                        checked={formData.outOfService}
                        onChange={handleChange}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl border border-red-100 flex items-center gap-2">
                  <span className="material-symbols-outlined !text-xl">error</span>
                  <p className="text-xs font-black">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center gap-2">
                  <span className="material-symbols-outlined !text-xl">check_circle</span>
                  <p className="text-xs font-black">Vehicle successfully updated! Redirecting...</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => navigate(-1)}
                  className="flex-1 py-4 px-8 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading || success}
                  className="flex-[2] py-4 px-8 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EditVehicle;
