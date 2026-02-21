import React, { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, collection, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import MainLayout from '../components/MainLayout';

const Settings = () => {
  const { settings: globalSettings, loading: settingsLoading } = useSettings();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (globalSettings) {
      setFormData({ ...globalSettings });
    }
  }, [globalSettings]);

  const hasChanges = useMemo(() => {
    if (!globalSettings || !formData) return false;
    const keys = Object.keys(formData).filter(k => !['lastUpdated', 'updatedBy', 'version'].includes(k));
    return keys.some(k => formData[k] !== globalSettings[k]);
  }, [formData, globalSettings]);

  const handleToggle = (key) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? 0 : Math.max(0, Number(value))) : value 
    }));
  };

  const validate = () => {
    if (formData.acquisitionCostDefault < 0) return "Acquisition cost cannot be negative.";
    if (formData.licenseExpiryAlertDays < 0) return "License expiry alert days must be at least 0.";
    if (formData.maintenanceReminderDays < 0) return "Maintenance reminder days must be at least 0.";
    if (!formData.companyName?.trim()) return "Company name is required.";
    return null;
  };

  const saveSettings = async () => {
    const error = validate();
    if (error) {
      setShowToast({ show: true, message: error, type: 'error' });
      setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 3000);
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "settings", "systemConfig");
      const updatedSettings = {
        ...formData,
        lastUpdated: serverTimestamp(),
        updatedBy: currentUser?.email || 'System Admin',
        version: "1.0.0"
      };

      await setDoc(docRef, updatedSettings, { merge: true });
      setShowToast({ show: true, message: 'Configuration Saved!', type: 'success' });
      setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setShowToast({ show: true, message: 'Save failed.', type: 'error' });
      setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 3000);
    } finally {
      setSaving(false);
    }
  };

  const exportAllData = async () => {
    try {
      const collectionsList = ["vehicles", "trips", "drivers", "fuelLogs", "maintenanceLogs"];
      const allData = {};
      for (const colName of collectionsList) {
        const snap = await getDocs(collection(db, colName));
        allData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FleetFlow_Export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const executeRecalculation = async () => {
    setSaving(true);
    try {
      const summariesSnap = await getDocs(collection(db, "summaries"));
      const deletePromises = summariesSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      setShowToast({ show: true, message: 'Audit complete!', type: 'success' });
      setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 3000);
    } catch (err) {
      console.error("Audit failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const ConfirmModal = () => {
    if (!pendingAction) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/60 backdrop-blur-sm p-4">
        <div className="glass-card p-10 max-w-md w-full shadow-2xl animate-toast-in">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <h3 className="text-2xl font-black text-[#2B3674] mb-2">Are you sure?</h3>
          <p className="text-slate-500 text-sm mb-10 font-bold">{pendingAction.message}</p>
          <div className="flex gap-4">
            <button onClick={() => setPendingAction(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 text-xs uppercase">Cancel</button>
            <button onClick={() => { pendingAction.action(); setPendingAction(null); }} className="flex-1 py-4 bg-[#2B3674] text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-slate-200">Confirm</button>
          </div>
        </div>
      </div>
    );
  };

  if (settingsLoading) return (
    <MainLayout title="Settings" breadcrumb="System / Config">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black">Synchronizing System Rules...</p>
        </div>
    </MainLayout>
  );

  return (
    <MainLayout title="System Control" breadcrumb="System / Config">
      <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-20">
        <ConfirmModal />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#2B3674]">System Control</h1>
              {hasChanges && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">Unsaved</span>}
            </div>
            <p className="text-sm font-bold text-slate-400">Enterprise configuration & safeguards</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={saveSettings} 
              disabled={saving || !hasChanges} 
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${hasChanges ? 'bg-primary text-white shadow-primary/20 hover:scale-105' : 'bg-slate-100 text-slate-400 shadow-none'}`}
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined !text-lg">save</span>}
              Commit Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* Section: Organization */}
          <div className="glass-card p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-primary">business</span>
              <div>
                <h3 className="text-lg font-black text-[#2B3674]">Organization Details</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Corporate Entity Registry</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency</label>
                  <select name="currency" value={formData.currency || '$'} onChange={handleChange} className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] outline-none appearance-none">
                    <option value="$">USD ($)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Region</label>
                  <input type="text" name="defaultRegion" value={formData.defaultRegion || ''} onChange={handleChange} className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Acquisition Baseline</label>
                  <input type="number" name="acquisitionCostDefault" value={formData.acquisitionCostDefault || 0} onChange={handleChange} className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Freight Rate (₹/kg)</label>
                  <input type="number" step="0.01" name="ratePerKg" value={formData.ratePerKg || 0} onChange={handleChange} className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Operational Rules */}
          <div className="glass-card p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <div>
                <h3 className="text-lg font-black text-[#2B3674]">Operational Rules</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Business logic enforcement</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: 'autoResetDriver', label: 'Auto-Available Status', desc: 'Reset driver status after trips.' },
                { id: 'blockExpiredLicense', label: 'Strict Compliance', desc: 'Block dispatch for expired licenses.' },
                { id: 'preventOverload', label: 'Capacity Check', desc: 'Block overloaded trip entry.' },
                { id: 'enableROI', label: 'ROI Analytics', desc: 'Enable financial dashboards.' }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F7FE]/50 hover:bg-[#F4F7FE] transition-colors">
                  <div>
                    <p className="text-sm font-black text-[#2B3674]">{item.label}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{item.desc}</p>
                  </div>
                  <button onClick={() => handleToggle(item.id)} className={`w-12 h-6 rounded-full transition-all relative ${formData[item.id] ? 'bg-primary' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData[item.id] ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Thresholds */}
          <div className="glass-card p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              <div>
                <h3 className="text-lg font-black text-[#2B3674]">Thresholds</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alert buffer periods</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Alert (Days)</label>
                <input type="number" name="licenseExpiryAlertDays" value={formData.licenseExpiryAlertDays || 0} onChange={handleChange} className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Reminder (Days)</label>
                <input type="number" name="maintenanceReminderDays" value={formData.maintenanceReminderDays || 0} onChange={handleChange} className="w-full bg-[#F4F7FE] border-none rounded-2xl py-4 px-5 text-sm font-bold text-[#2B3674] outline-none" />
              </div>
            </div>
          </div>

          {/* Section: Diagnostic */}
          <div className="glass-card p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
              <span className="material-symbols-outlined text-primary">terminal</span>
              <div>
                <h3 className="text-lg font-black text-[#2B3674]">Diagnostic Controls</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Maintenance & Maintenance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setPendingAction({ message: "Perform full KPI audit?", action: executeRecalculation })} 
                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 hover:bg-slate-100 transition-all text-left"
              >
                <span className="material-symbols-outlined text-primary mb-2 block">refresh</span>
                <p className="text-sm font-black text-[#2B3674]">Audit KPIs</p>
                <p className="text-[9px] text-slate-400 font-bold">Refresh all calculations</p>
              </button>
              <button 
                onClick={exportAllData} 
                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 hover:bg-slate-100 transition-all text-left"
              >
                <span className="material-symbols-outlined text-green-500 mb-2 block">download</span>
                <p className="text-sm font-black text-[#2B3674]">Export Data</p>
                <p className="text-[9px] text-slate-400 font-bold">Download JSON snapshot</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showToast.show && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-toast-in ${showToast.type === 'success' ? 'bg-[#2B3674] text-white' : 'bg-red-500 text-white'}`}>
          <span className="material-symbols-outlined">{showToast.type === 'success' ? 'verified' : 'error'}</span>
          <span className="text-xs font-black uppercase tracking-widest">{showToast.message}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-in { 0% { transform: translate(-50%, 50px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        .animate-toast-in { animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}} />
    </MainLayout>
  );
};

export default Settings;
