import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { settings } = useSettings();
  const { role } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Define all possible menu items
  const allMenuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard', roles: ['manager', 'dispatcher'] },
    { name: 'Trip Dispatcher', icon: 'local_shipping', path: '/trip-dispatcher', roles: ['manager', 'dispatcher'] },
    { name: 'Driver Profiles', icon: 'groups', path: '/drivers', roles: ['manager', 'dispatcher'] },
    { name: 'Maintenance', icon: 'build', path: '/maintenance', roles: ['manager', 'dispatcher'] },
    { name: 'Expenses & Fuel', icon: 'payments', path: '/expenses', roles: ['manager', 'dispatcher'] },
    { name: 'Reports', icon: 'bar_chart', path: '/reports', roles: ['manager'] },
    { name: 'Manage Users', icon: 'person_add', path: '/manage-users', roles: ['manager'] },
    { name: 'Settings', icon: 'settings', path: '/settings', roles: ['manager'] },
  ];

  // Filter based on role
  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  const companyInitial = settings.companyName ? settings.companyName.charAt(0).toUpperCase() : 'F';

  return (
    <aside 
      className={`sidebar-container h-full bg-[#F4F7FE] border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
    >
      {/* Sidebar Header */}
      <div className={`flex items-center justify-between p-6 mb-4 ${isCollapsed ? 'flex-col gap-4' : ''}`}>
        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'scale-0 w-0 opacity-0' : 'opacity-100 scale-100'}`}>
          <div className="min-w-[40px] w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
            {companyInitial}
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#2B3674] whitespace-nowrap">
            {settings.companyName || 'FleetFlow'}
          </span>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-xl hover:bg-white text-slate-400 hover:text-primary transition-all shadow-sm bg-white active:scale-90 flex items-center justify-center ${isCollapsed ? 'mr-0' : ''}`}
        >
          <span className="material-symbols-outlined !text-xl">
            {isCollapsed ? 'menu_open' : 'menu'}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : ""}
              className={({ isActive }) => `
                sidebar-link group relative flex items-center
                ${isActive ? 'sidebar-link-active' : ''}
                ${isCollapsed ? 'justify-center px-0 h-12 w-12 mx-auto rounded-xl' : 'px-4 py-3.5 rounded-2xl'}
              `}
            >
              <span className={`material-symbols-outlined transition-colors duration-300 ${isActive ? 'text-primary' : 'group-hover:text-primary'} ${isCollapsed ? '!text-2xl' : ''}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="whitespace-nowrap font-bold text-sm tracking-wide ml-3 transition-opacity duration-300">
                  {item.name}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-l-full shadow-[0px_0px_10px_rgba(67,24,255,0.4)]" />
              )}
              {isActive && isCollapsed && (
                 <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className={`p-6 mt-auto border-t border-slate-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#2B3674]">Enterprise v2.0</span>
              <span className="text-[10px] text-slate-400">System Healthy</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
