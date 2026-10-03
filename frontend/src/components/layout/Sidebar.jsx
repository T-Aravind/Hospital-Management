import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  BedDouble, 
  Stethoscope, 
  HeartPulse, 
  Receipt, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
  Building2,
  Server
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed, 
  dataSource = 'CSV',
  activeHospital,
  onOpenHospitalManager
}) {
  const menuItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, badge: 'Live' },
    { id: 'patients', label: 'Patient Analytics', icon: Users },
    { id: 'admissions', label: 'Admissions & Triage', icon: CalendarCheck },
    { id: 'beds', label: 'Bed Management', icon: BedDouble },
    { id: 'doctors', label: 'Doctor Analytics', icon: Stethoscope },
    { id: 'treatments', label: 'Treatment Analytics', icon: HeartPulse },
    { id: 'billing', label: 'Billing & Financial', icon: Receipt },
  ];

  const hospitalName = activeHospital?.name || 'Hospital Intelligence';

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen bg-navy-900 text-slate-200 transition-all duration-300 ease-in-out flex flex-col border-r border-navy-800 shadow-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-navy-800/80">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="h-10 w-10 min-w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-glow">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-white truncate">
                Hospital Intelligence
              </span>
              <span className="text-[11px] font-medium text-brand-400 truncate">
                Universal Analytics Engine
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Hospital Context Pill */}
      {!collapsed && (
        <div 
          onClick={onOpenHospitalManager}
          className="px-4 py-2.5 bg-navy-950/60 border-b border-navy-800/60 hover:bg-navy-800/40 cursor-pointer transition-colors group"
          title="Click to switch hospital database or connect custom database"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-hidden">
              <Building2 className="h-3.5 w-3.5 text-brand-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-slate-200 truncate group-hover:text-brand-300">
                {hospitalName}
              </span>
            </div>
            <span className="text-[9px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.5 rounded border border-brand-500/30 shrink-0">
              {activeHospital?.code || 'ACTIVE'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-900/30 font-semibold'
                  : 'text-slate-300 hover:bg-navy-800/70 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`h-5 w-5 min-w-5 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-300'
                }`}
              />
              {!collapsed && (
                <span className="ml-3 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-brand-900/60 text-brand-200' : 'bg-brand-500/20 text-brand-300'
                }`}>
                  {item.badge}
                </span>
              )}
              {collapsed && isActive && (
                <span className="absolute right-1 w-1.5 h-6 bg-brand-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status & Database Manager */}
      <div className="p-3 border-t border-navy-800/80 bg-navy-950/30">
        {!collapsed ? (
          <div 
            onClick={onOpenHospitalManager}
            className="bg-navy-800/50 hover:bg-navy-800/80 rounded-xl p-3 border border-navy-700/50 cursor-pointer transition-all group"
            title="Click to manage database connection"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-medium group-hover:text-brand-300">
                <Database className="h-3.5 w-3.5 text-brand-400" />
                <span className="truncate">DB: {dataSource}</span>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Database Engine</span>
              <span className="text-emerald-400 font-medium">Connected & Live</span>
            </div>
          </div>
        ) : (
          <div 
            onClick={onOpenHospitalManager}
            className="flex justify-center cursor-pointer" 
            title={`Active Database: ${dataSource} - Click to switch hospital`}
          >
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
