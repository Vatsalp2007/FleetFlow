import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import MainLayout from './components/MainLayout';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './context/AuthContext';
import PremiumMetricCard from './components/PremiumMetricCard';
import AnalyticsChart from './components/AnalyticsChart';
import FleetMap from './components/FleetMap';
import ActiveFleetList from './components/ActiveFleetList';
import OperationalDonut from './components/OperationalDonut';

const Dashboard = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const { settings } = useSettings();
  const { role } = useAuth();
  
  useEffect(() => {
    // Vehicles listener
    const q = query(collection(db, "vehicles"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehicles(data);
    }, (error) => {
      console.error("Error fetching vehicles:", error);
    });

    // Trips listener
    const unsubTrips = onSnapshot(collection(db, "trips"), (snap) => {
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fuel Costs listener
    const unsubFuel = onSnapshot(collection(db, "fuelLogs"), (snap) => {
      setFuelLogs(snap.docs.map(d => d.data()));
    });

    // Maintenance Costs listener
    const unsubMaint = onSnapshot(collection(db, "maintenanceLogs"), (snap) => {
      setMaintenanceLogs(snap.docs.map(d => d.data()));
    });

    // Drivers listener
    const unsubDrivers = onSnapshot(collection(db, "drivers"), (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribe();
      unsubFuel();
      unsubMaint();
      unsubTrips();
      unsubDrivers();
    };
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    // Active Fleet: Trips marked "dispatched"
    const activeCount = trips.filter(t => t.status?.toLowerCase() === 'dispatched').length;
    
    // Total Shipments: Sum of all trips
    const totalShipments = trips.length;
    
    // Total Shipments: Trips marked "completed"
    const completedCount = trips.filter(t => t.status?.toLowerCase() === 'completed').length;

    // Maintenance Alerts: Vehicles marked "in shop"
    const maintenanceCount = vehicles.filter(v => v.status?.toLowerCase() === 'in shop').length;
    
    // Utilization Rate
    const totalVehicles = vehicles.length;
    const utilizationRate = totalVehicles > 0 
      ? Math.round((activeCount / totalVehicles) * 100) 
      : 0;

    // Operational Cost
    const fCost = fuelLogs.reduce((sum, l) => sum + (l.cost || 0), 0);
    const mCost = maintenanceLogs.reduce((sum, l) => sum + (l.cost || 0), 0);

    return {
      activeFleet: activeCount,
      totalShipments: trips.length,
      pendingCargo: trips.filter(t => t.status?.toLowerCase() === 'draft').length,
      completedTrips: completedCount,
      maintenanceAlerts: maintenanceCount,
      utilizationRate: utilizationRate,
      totalVehicles: totalVehicles,
      totalOpCost: fCost + mCost,
      onTimeRate: trips.length > 0 ? Math.round((completedCount / trips.length) * 100) : 98
    };
  }, [vehicles, trips, fuelLogs, maintenanceLogs]);

  return (
    <MainLayout title="Main Dashboard" breadcrumb="Dashboard">
      <div className="w-full max-w-[1600px] mx-auto space-y-8">
        
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Fleet Overview</h1>
            <p className="text-sm font-bold text-slate-400">Real-time operational dashboard</p>
          </div>
          {role === 'manager' && (
            <button 
              onClick={() => navigate('/add-vehicle')}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined !text-xl">add_circle</span>
              Add Vehicle
            </button>
          )}
        </div>
        
        {/* Section 1: Hero Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <PremiumMetricCard 
            title="Total Vehicles" 
            value={kpis.totalVehicles} 
            subtext="fleet size"
            trend="up"
            trendValue="0"
            icon="local_shipping"
            color="blue"
          />
          <PremiumMetricCard 
            title="Active Fleet" 
            value={kpis.activeFleet} 
            subtext="on route"
            trend="up"
            trendValue="8%"
            icon="directions_run"
            color="green"
          />
          <PremiumMetricCard 
            title="Pending Cargo" 
            value={kpis.pendingCargo} 
            subtext="awaiting dispatch"
            trend="up"
            trendValue="0"
            icon="inventory_2"
            color="yellow"
          />
          <PremiumMetricCard 
            title="Maintenance Alerts" 
            value={kpis.maintenanceAlerts} 
            subtext="critical issues"
            trend="down"
            trendValue="0"
            icon="warning"
            color="red"
          />
        </div>

        {/* Section 2: Analytics & Map */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnalyticsChart trips={trips} />
          <FleetMap vehicles={vehicles} />
        </div>

        {/* Section 3: Operations & Extra Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Donut */}
          <OperationalDonut trips={trips} />

          {/* Operational Cost & Efficiency */}
          <div className="space-y-6">
            <div className="glass-card p-6 premium-gradient text-white relative overflow-hidden group">
              <div className="relative z-10">
                  <span className="text-xs font-bold text-white/70 uppercase">Total Operational Cost</span>
                  <h3 className="text-3xl font-black mt-1">{settings?.systemConfig?.currency || '$'}{kpis.totalOpCost.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                      <span className="material-symbols-outlined !text-sm">payments</span>
                      Lifetime Expenses
                  </div>
               </div>
            </div>

            <div className="glass-card p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet Efficiency</span>
                <div className="flex items-center gap-3 mt-1">
                   <h4 className="text-2xl font-black text-[#2B3674]">{kpis.utilizationRate}%</h4>
                   <div className="px-2 py-0.5 bg-green-100 text-green-600 rounded-md text-[10px] font-black shadow-sm">OPTIMAL</div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            {/* System Health */}
            <div className="glass-card p-6">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live System Health</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
               </div>
               <p className="text-sm font-bold text-[#2B3674]">All systems operational.</p>
               <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[99.9%] bg-primary" />
               </div>
            </div>
          </div>
        </div>

        {/* Section 4: Active Fleet Full Width */}
        <div className="w-full">
          <ActiveFleetList vehicles={vehicles} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
