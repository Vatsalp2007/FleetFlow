import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    companyName: 'FleetFlow Logistics',
    currency: '$',
    defaultRegion: 'Central Hub',
    acquisitionCostDefault: 25000,
    ratePerKg: 0.5,
    autoResetDriver: true,
    blockExpiredLicense: true,
    preventOverload: true,
    enableROI: true,
    requireDriver: true,
    requireMaintenance: false,
    allowCancelAfterDispatch: false,
    licenseExpiryAlertDays: 30,
    maintenanceReminderDays: 7,
    version: "1.0.0"
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(() => {
    const docRef = doc(db, "settings", "systemConfig");
    
    // Using onSnapshot for real-time updates across the app
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
      setLoading(false);
    }, (err) => {
      console.error("Settings listener error:", err);
      setLoading(false);
    });

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = fetchSettings();
    return () => unsub();
  }, [fetchSettings]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    const docRef = doc(db, "settings", "systemConfig");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setSettings(prev => ({ ...prev, ...docSnap.data() }));
    }
    setLoading(false);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
