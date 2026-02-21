import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useSettings } from '../context/SettingsContext';

const Navbar = ({ title = "Main Dashboard", breadcrumb = "Dashboard" }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <nav className="sticky top-4 z-[90] mx-4 sm:mx-8 mt-4 shrink-0">
      <div className="glass-card px-6 py-3 flex items-center justify-between">
        {/* Left Side: Page Title & Breadcrumb */}
        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-slate-400">Pages / {breadcrumb}</span>
          <h2 className="text-[20px] font-black text-[#2B3674] leading-tight">{title}</h2>
        </div>

        {/* Right Side: Tools & Profile */}
        <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-white/30 shadow-sm backdrop-blur-md">
          {/* Search Bar */}
          <div className="relative hidden lg:block">
            <input
              type="text"
              placeholder="Search..."
              className="bg-[#F4F7FE] border-none rounded-full py-2.5 pl-10 pr-4 text-xs font-medium text-[#2B3674] focus:ring-2 focus:ring-primary/20 w-48 transition-all outline-none"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 !text-lg text-slate-400">search</span>
          </div>

          {/* Real-time Clock */}
          <div className="hidden sm:flex flex-col items-end px-3 border-r border-slate-200">
            <span className="text-sm font-black text-[#2B3674]">{formattedTime}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formattedDate}</span>
          </div>

          {/* Notification Icon */}
          <button className="p-2 rounded-xl hover:bg-[#F4F7FE] text-slate-400 transition-colors relative group">
            <span className="material-symbols-outlined !text-xl">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-125 transition-transform" />
          </button>

          {/* Settings Icon */}
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl hover:bg-[#F4F7FE] text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined !text-xl">settings</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer hover:scale-105 transition-transform">
              AD
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all font-bold"
              title="Logout"
            >
              <span className="material-symbols-outlined !text-xl">logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
