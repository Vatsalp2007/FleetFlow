import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import MainLayout from '../components/MainLayout';
import { useSettings } from "../context/SettingsContext";
import { formatLabel } from "../utils/utils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line
} from 'recharts';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const ReportsDashboard = () => {
  const [data, setData] = useState({
    vehicles: [],
    trips: [],
    fuelLogs: [],
    maintenanceLogs: [],
    drivers: []
  });
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vSnap = await getDocs(collection(db, "vehicles"));
        const tSnap = await getDocs(collection(db, "trips"));
        const fSnap = await getDocs(collection(db, "fuelLogs"));
        const mSnap = await getDocs(collection(db, "maintenanceLogs"));
        const dSnap = await getDocs(collection(db, "drivers"));

        setData({
          vehicles: vSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          trips: tSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          fuelLogs: fSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          maintenanceLogs: mSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          drivers: dSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        });
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const reportData = useMemo(() => {
    if (loading) return null;

    const vehicleStats = data.vehicles.map(v => {
      const vTrips = data.trips.filter(t => t.vehicleId === v.id && t.status === "completed");
      const revenue = vTrips.reduce((sum, t) => sum + (Number(t.freightAmount) || 0), 0); 
      const vFuel = data.fuelLogs.filter(f => f.vehicleId === v.id);
      const fuelCost = vFuel.reduce((sum, f) => sum + (f.cost || 0), 0);
      const vMaint = data.maintenanceLogs.filter(m => m.vehicleId === v.id);
      const maintCost = vMaint.reduce((sum, m) => sum + (m.cost || 0), 0);
      const acqCost = Number(v.acquisitionCost) || settings.acquisitionCostDefault || 25000;
      const profit = revenue - (fuelCost + maintCost);
      const roi = acqCost > 0 ? (profit / acqCost) * 100 : 0;

      return {
        name: v.name,
        revenue,
        fuelCost,
        maintCost,
        profit,
        roi: roi.toFixed(1),
        efficiency: 0 
      };
    });

    const driverStats = data.drivers.map(d => {
      const dTrips = data.trips.filter(t => t.driverId === d.id);
      return {
        name: d.name,
        completed: dTrips.filter(t => t.status === "completed").length,
        category: formatLabel(d.category)
      };
    });

    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const monthlyTrend = months.map(month => {
      const fCost = data.fuelLogs
        .filter(f => f.date && new Date(f.date).toLocaleString('default', { month: 'short' }) === month)
        .reduce((sum, f) => sum + (f.cost || 0), 0);
      const mCost = data.maintenanceLogs
        .filter(m => m.date && new Date(m.date).toLocaleString('default', { month: 'short' }) === month)
        .reduce((sum, m) => sum + (m.cost || 0), 0);
      return { month, cost: fCost + mCost };
    });

    const totals = {
      revenue: vehicleStats.reduce((sum, v) => sum + v.revenue, 0),
      fuel: vehicleStats.reduce((sum, v) => sum + v.fuelCost, 0),
      maint: vehicleStats.reduce((sum, v) => sum + v.maintCost, 0),
      profit: vehicleStats.reduce((sum, v) => sum + v.profit, 0)
    };

    return { vehicleStats, driverStats, totals, monthlyTrend };
  }, [data, loading, settings.acquisitionCostDefault]);

  const exportCSV = () => {
    if (!reportData) return;
    const headers = ["Vehicle", "Revenue", "Fuel Cost", "Maintenance Cost", "Net Profit", "KM/L"];
    const rows = reportData.vehicleStats.map(v => [
      v.name, v.revenue, v.fuelCost, v.maintCost, v.profit, v.efficiency
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fleet_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("FleetFlow Executive Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Total Value']],
      body: [
        ['Total Revenue', `${settings.currency}${reportData.totals.revenue.toLocaleString()}`],
        ['Total Fuel Expense', `${settings.currency}${reportData.totals.fuel.toLocaleString()}`],
        ['Total Maintenance Expense', `${settings.currency}${reportData.totals.maint.toLocaleString()}`],
        ['Net Operational Profit', `${settings.currency}${reportData.totals.profit.toLocaleString()}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [67, 24, 255] }
    });

    doc.text("Vehicle Performance Breakdown", 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Vehicle', 'Revenue', 'Fuel', 'Maintenance', 'Profit']],
      body: reportData.vehicleStats.map(v => [
        v.name, `${settings.currency}${v.revenue}`, `${settings.currency}${v.fuelCost}`, `${settings.currency}${v.maintCost}`, `${settings.currency}${v.profit}`
      ]),
      theme: 'grid'
    });

    doc.save(`FleetFlow_Analytic_Report_${new Date().getTime()}.pdf`);
  };

  if (loading) return (
    <MainLayout title="Reports" breadcrumb="Executive / Insights">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black">Generating Executive Insights...</p>
        </div>
    </MainLayout>
  );

  return (
    <MainLayout title="Executive Analytics" breadcrumb="Executive / Insights">
      <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#2B3674]">Executive Analytics</h1>
            <p className="text-sm font-bold text-slate-400">Consolidated financial and operational performance</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined !text-lg text-primary">csv</span>
              Export CSV
            </button>
            <button 
              onClick={exportPDF}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined !text-lg">picture_as_pdf</span>
              Download PDF
            </button>
          </div>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 shadow-xl">
             <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue</p>
                <h3 className="text-2xl font-black text-[#2B3674]">{settings.currency}{reportData.totals.revenue.toLocaleString()}</h3>
                <span className="text-[10px] font-bold text-green-500 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined !text-sm">trending_up</span> Active Ops
                </span>
             </div>
          </div>
          <div className="glass-card p-6 shadow-xl">
             <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
                <h3 className="text-2xl font-black text-[#2B3674]">{settings.currency}{(reportData.totals.fuel + reportData.totals.maint).toLocaleString()}</h3>
                <span className="text-[10px] font-bold text-amber-500 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined !text-sm">payments</span> Fuel & Service
                </span>
             </div>
          </div>
          <div className="glass-card p-6 shadow-xl border-l-4 border-l-primary">
             <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Op Profit</p>
                <h3 className="text-2xl font-black text-primary">{settings.currency}{reportData.totals.profit.toLocaleString()}</h3>
                <span className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined !text-sm">account_balance_wallet</span> Post-Expense Margin
                </span>
             </div>
          </div>
          <div className="glass-card p-6 shadow-xl">
             <div className="flex flex-col">
                <p className="text-[10px) font-black text-slate-400 uppercase tracking-widest mb-1">Fleet ROI</p>
                <h3 className="text-2xl font-black text-[#2B3674]">
                  {(reportData.vehicleStats.reduce((sum, v) => sum + parseFloat(v.roi), 0) / reportData.vehicleStats.length || 0).toFixed(1)}%
                </h3>
                <span className="text-[10px] font-bold text-purple-600 mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined !text-sm">analytics</span> Asset Performance
                </span>
             </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 shadow-xl">
                <h3 className="text-lg font-black text-[#2B3674] mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">bar_chart</span>
                    Revenue vs Expenses
                </h3>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.vehicleStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF7" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 10, fontWeight: 700}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 10, fontWeight: 700}} />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(112, 144, 176, 0.15)' }} />
                            <Legend iconType="circle" />
                            <Bar dataKey="revenue" fill="#4318FF" radius={[10, 10, 0, 0]} name="Revenue" />
                            <Bar dataKey="fuelCost" fill="#FFB547" radius={[10, 10, 0, 0]} name="Fuel" />
                            <Bar dataKey="maintCost" fill="#EE5D50" radius={[10, 10, 0, 0]} name="Maint" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-card p-8 shadow-xl">
                <h3 className="text-lg font-black text-[#2B3674] mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600">trending_up</span>
                    6-Month Cost Trend
                </h3>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF7" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 10, fontWeight: 700}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#A3AED0', fontSize: 10, fontWeight: 700}} />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(112, 144, 176, 0.15)' }} />
                            <Line type="monotone" dataKey="cost" stroke="#FFB547" strokeWidth={5} dot={{fill: '#FFB547', r: 6, strokeWidth: 4, stroke: '#fff'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 glass-card shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 text-lg font-black text-[#2B3674] flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600">stars</span>
                    Top Drivers
                </div>
                <div className="p-6 space-y-6">
                    {reportData.driverStats.sort((a,b) => b.completed - a.completed).slice(0, 5).map((driver, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black">
                                    {driver.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[#2B3674]">{driver.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{driver.category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-[#2B3674]">{driver.completed}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Trips</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 glass-card shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 text-lg font-black text-[#2B3674] flex justify-between items-center">
                    Vehicle P&L Breakdown
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profitability Audit</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F4F7FE]">
                            <tr>
                                <th className="px-6 py-4">Asset</th>
                                <th className="px-6 py-4">Revenue</th>
                                <th className="px-6 py-4">Total Cost</th>
                                <th className="px-6 py-4 text-right">Net Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.vehicleStats.map((v, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-[#2B3674]">{v.name}</td>
                                    <td className="px-6 py-4 text-green-500 font-black">+{settings.currency}{v.revenue.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-400 font-black">-{settings.currency}{(v.fuelCost + v.maintCost).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${v.profit >= 0 ? 'bg-primary/5 text-primary' : 'bg-red-50 text-red-500'}`}>
                                            {v.profit >= 0 ? '+' : '-'}{settings.currency}{Math.abs(v.profit).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportsDashboard;
