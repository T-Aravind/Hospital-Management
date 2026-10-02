import React from 'react';
import { 
  Bell, 
  RotateCw, 
  Building2, 
  Calendar, 
  Search,
  Sparkles,
  Layers
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  onRefresh, 
  isRefreshing, 
  globalFilters, 
  setGlobalFilters,
  departments = []
}) {
  const tabTitles = {
    overview: { title: 'Executive Operations Dashboard', desc: 'Holistic clinical, capacity, physician, and revenue intelligence' },
    patients: { title: 'Patient Demographics & Cohort Analytics', desc: 'Catchment distribution, age cohorts, blood groups, and patient history' },
    admissions: { title: 'Admissions & Triage Intelligence', desc: 'Emergency response, waiting times, length of stay, and readmission metrics' },
    beds: { title: 'Bed Inventory & Capacity Management', desc: 'Ward-level occupancy, ICU allocation, and real-time floor distribution' },
    doctors: { title: 'Physician Workload & Productivity', desc: 'Clinical caseloads, surgery volumes, experience tiers, and revenue contribution' },
    treatments: { title: 'Clinical Outcomes & Procedure Efficacy', desc: 'Procedure recovery rates, surgery distributions, and therapeutic outcomes' },
    billing: { title: 'Revenue Cycle & Financial Intelligence', desc: 'Tariff breakdowns, insurance co-pay ratios, and department collections' },
  };

  const currentInfo = tabTitles[activeTab] || tabTitles.overview;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-6 py-3.5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-0.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Tamil Nadu Health Network</span>
            <span className="text-slate-300">•</span>
            <span>10 Departments</span>
            <span className="text-slate-300">•</span>
            <span>300 Beds</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {currentInfo.title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentInfo.desc}
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Year Filter Pill */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-medium text-slate-600">
            <button
              onClick={() => setGlobalFilters(prev => ({ ...prev, startDate: '', endDate: '' }))}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                !globalFilters.startDate && !globalFilters.endDate 
                  ? 'bg-white text-brand-700 font-semibold shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setGlobalFilters(prev => ({ ...prev, startDate: '2025-01-01', endDate: '2025-12-31' }))}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                globalFilters.startDate === '2025-01-01' 
                  ? 'bg-white text-brand-700 font-semibold shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              FY 2025
            </button>
            <button
              onClick={() => setGlobalFilters(prev => ({ ...prev, startDate: '2024-01-01', endDate: '2024-12-31' }))}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                globalFilters.startDate === '2024-01-01' 
                  ? 'bg-white text-brand-700 font-semibold shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              FY 2024
            </button>
          </div>

          {/* Department Quick Filter */}
          <div className="relative">
            <select
              value={globalFilters.department || 'all'}
              onChange={(e) => setGlobalFilters(prev => ({ ...prev, department: e.target.value }))}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs cursor-pointer"
            >
              <option value="all">All Departments (10)</option>
              {departments.map((d) => (
                <option key={d.Department_ID} value={d.Department_Name}>
                  {d.Department_Name}
                </option>
              ))}
            </select>
            <Layers className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            title="Refresh analytics dataset"
          >
            <RotateCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
