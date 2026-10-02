import React from 'react';
import { Filter, X, Calendar, Layers, Activity, User, ShieldCheck } from 'lucide-react';

export default function FilterBar({
  filters = {},
  onChange,
  onReset,
  departments = [],
  showDepartment = true,
  showAdmissionType = false,
  showInsurance = false,
  showGender = false,
  showDateRange = true,
  showReadmission = false,
  showBedType = false,
  showWard = false,
  showSurgery = false,
  showOutcome = false,
  wards = [],
  bedTypes = [],
  outcomes = [],
  className = '',
}) {
  const activeCount = Object.entries(filters).filter(([k, v]) => {
    return v !== undefined && v !== null && v !== '' && v !== 'all';
  }).length;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider pr-2 border-r border-slate-200">
          <Filter className="h-3.5 w-3.5 text-brand-600" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </div>

        {/* Department Filter */}
        {showDepartment && (
          <div className="relative">
            <select
              value={filters.department || 'all'}
              onChange={(e) => onChange('department', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Department: All</option>
              {departments.map((d) => (
                <option key={d.Department_ID || d} value={d.Department_Name || d}>
                  {d.Department_Name || d}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Admission Type Filter */}
        {showAdmissionType && (
          <div className="relative">
            <select
              value={filters.admissionType || 'all'}
              onChange={(e) => onChange('admissionType', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Admission Type: All</option>
              <option value="Emergency">Emergency</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
            </select>
          </div>
        )}

        {/* Readmission Filter */}
        {showReadmission && (
          <div className="relative">
            <select
              value={filters.readmission || 'all'}
              onChange={(e) => onChange('readmission', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Readmission: All</option>
              <option value="Yes">Readmitted (Yes)</option>
              <option value="No">No Readmission (No)</option>
            </select>
          </div>
        )}

        {/* Ward Filter */}
        {showWard && (
          <div className="relative">
            <select
              value={filters.ward || 'all'}
              onChange={(e) => onChange('ward', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Ward: All</option>
              {wards.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        )}

        {/* Bed Type Filter */}
        {showBedType && (
          <div className="relative">
            <select
              value={filters.bedType || 'all'}
              onChange={(e) => onChange('bedType', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Bed Type: All</option>
              {bedTypes.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Gender Filter */}
        {showGender && (
          <div className="relative">
            <select
              value={filters.gender || 'all'}
              onChange={(e) => onChange('gender', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Gender: All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        )}

        {/* Insurance Filter */}
        {showInsurance && (
          <div className="relative">
            <select
              value={filters.insurance || 'all'}
              onChange={(e) => onChange('insurance', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Insurance: All</option>
              <option value="Yes">Insured (80% Cover)</option>
              <option value="No">Self-Pay (100%)</option>
            </select>
          </div>
        )}

        {/* Surgery Filter */}
        {showSurgery && (
          <div className="relative">
            <select
              value={filters.surgery || 'all'}
              onChange={(e) => onChange('surgery', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Procedure: All</option>
              <option value="Yes">Surgical</option>
              <option value="No">Non-Surgical</option>
            </select>
          </div>
        )}

        {/* Outcome Filter */}
        {showOutcome && (
          <div className="relative">
            <select
              value={filters.outcome || 'all'}
              onChange={(e) => onChange('outcome', e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="all">Outcome: All</option>
              <option value="Recovered">Recovered</option>
              <option value="Improved">Improved</option>
              <option value="Referred">Referred</option>
              <option value="Deceased">Deceased</option>
            </select>
          </div>
        )}

        {/* Date Range */}
        {showDateRange && (
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onChange('startDate', e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
              title="Start Date"
            />
            <span className="text-slate-300 text-xs font-bold">→</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onChange('endDate', e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
              title="End Date"
            />
          </div>
        )}
      </div>

      {/* Reset Filters */}
      {activeCount > 0 && onReset && (
        <button
          onClick={onReset}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition-all shadow-2xs"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}
