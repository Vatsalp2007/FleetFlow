import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import MainLayout from '../components/MainLayout';

const AddVehicle = () => {
  const navigate = useNavigate();
  
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict Validation
    if (!formData.name || !formData.licensePlate || !formData.type || !formData.maxLoad) {
      setError("Please fill out all required fields.");
      return;
    }

    if (Number(formData.maxLoad) <= 0) {
      setError("Capacity must be a positive number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "vehicles"), {
        name: formData.name,
        model: formData.model,
        licensePlate: formData.licensePlate.toUpperCase(),
        type: formData.type.trim().toLowerCase(),
        region: formData.region,
        capacity: Number(formData.maxLoad),
        odometer: Number(formData.odometer) || 0,
        status: "available",
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error("Error adding vehicle: ", err);
      setError("Failed to add vehicle. Please try again.");
    } finally {
      if(!success) setLoading(false);
    }
  };

  return (
    <MainLayout title="Add New Vehicle" breadcrumb="Fleet / Add">
      <div className="w-full max-w-[800px] mx-auto space-y-8">
        
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-primary transition-all active:scale-90"
          >
            <span className="material-symbols-outlined !text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Add New Vehicle</h1>
            <p className="text-sm font-bold text-slate-400">Register a new asset to your fleet</p>
          </div>
        </div>

        <div className="glass-card p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Name */}
              <div className="space-y-2">
                <label className="text-sm font-black text-[#2B3674] ml-1">Vehicle Name *</label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Heavy Duty Truck 01"
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  required
                />
              </div>

              {/* License Plate */}
              <div className="space-y-2">
                <label className="text-sm font-black text-[#2B3674] ml-1">License Plate *</label>
                <input 
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  placeholder="ABC-1234"
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none uppercase"
                  required
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label className="text-sm font-black text-[#2B3674] ml-1">Model / Make</label>
                <input 
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. Mercedes-Benz Actros"
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              {/* Vehicle Type */}
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
                  <option value="Car">Car</option>
                </select>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="text-sm font-black text-[#2B3674] ml-1">Load Capacity (kg) *</label>
                <input 
                  type="number"
                  name="maxLoad"
                  value={formData.maxLoad}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  required
                />
              </div>

              {/* Odometer */}
              <div className="space-y-2">
                <label className="text-sm font-black text-[#2B3674] ml-1">Odometer Reading (km)</label>
                <input 
                  type="number"
                  name="odometer"
                  value={formData.odometer}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              {/* Region */}
              <div className="space-y-2">
                <label className="text-sm font-black text-[#2B3674] ml-1">Operating Region</label>
                <select 
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                >
                  <option value="">Select region</option>
                  <option value="North">North Sector</option>
                  <option value="South">South Sector</option>
                  <option value="East">East Sector</option>
                  <option value="West">West Sector</option>
                  <option value="Central">Central Hub</option>
                </select>
              </div>
            </div>

            {/* Status Info Box */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary !text-xl mt-0.5">info</span>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                New vehicles are registered as <span className="text-primary">Available</span> by default. You can change the operational status later from the vehicle management section.
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl border border-red-100 flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined !text-xl">error</span>
                <p className="text-xs font-black">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center gap-2">
                <span className="material-symbols-outlined !text-xl">check_circle</span>
                <p className="text-xs font-black">Vehicle successfully added! Redirecting...</p>
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
                ) : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default AddVehicle;
