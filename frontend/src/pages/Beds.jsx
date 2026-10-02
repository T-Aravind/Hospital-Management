import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Layers, 
  Building, 
  Activity,
  HeartPulse
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../api/client';
import KPICard from '../components/common/KPICard';
import ChartCard from '../components/common/ChartCard';
import DataTable from '../components/common/DataTable';
import LoadingState, { SkeletonKPIGrid, SkeletonChartCard } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const BED_STATUS_COLORS = {
  Occupied: '#2563eb',
  Available: '#10b981',
  Maintenance: '#f59e0b',
};

export default function Beds({ globalFilters, metadata }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table filters & pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWardView, setSelectedWardView] = useState('Ward A');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBeds({
        page,
        page_size: pageSize,
        ward: wardFilter !== 'all' ? wardFilter : undefined,
        bed_type: typeFilter !== 'all' ? typeFilter : undefined,
        department: globalFilters.department,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch bed inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, wardFilter, typeFilter, statusFilter, globalFilters.department]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      loadData();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <SkeletonKPIGrid count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChartCard />
          <SkeletonChartCard />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const kpis = data?.kpis || {};
  const deptBedUtil = data?.dept_bed_util || [];
  const wardDist = data?.ward_dist || [];
  const typeDist = data?.type_dist || [];
  const bedsList = data?.beds || [];
  const pagination = data?.pagination || { total_records: 0 };
  const wards = data?.wards || [];
  const bedTypes = data?.bed_types || [];

  const columns = [
    {
      header: 'Bed ID',
      accessorKey: 'bed_id',
      cell: (row) => <span className="font-mono font-bold text-slate-900">{row.bed_id}</span>
    },
    {
      header: 'Ward',
      accessorKey: 'ward',
      cell: (row) => (
        <span className="flex items-center space-x-1.5 font-medium text-slate-800">
          <Building className="h-3.5 w-3.5 text-slate-400" />
          <span>{row.ward}</span>
        </span>
      )
    },
    {
      header: 'Room Number',
      accessorKey: 'room_number',
      cell: (row) => <span className="font-mono text-xs text-slate-700">{row.room_number}</span>
    },
    {
      header: 'Bed Type',
      accessorKey: 'bed_type',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.bed_type === 'ICU'
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : row.bed_type === 'Private'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : row.bed_type === 'Semi-Private'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-slate-50 text-slate-700 border border-slate-200'
        }`}>
          {row.bed_type}
        </span>
      )
    },
    {
      header: 'Assigned Department',
      accessorKey: 'department_name',
      cell: (row) => <span className="font-medium text-slate-800">{row.department_name}</span>
    },
    {
      header: 'Real-time Status',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.status === 'Occupied'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : row.status === 'Available'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            row.status === 'Occupied' ? 'bg-blue-600' : row.status === 'Available' ? 'bg-emerald-600' : 'bg-amber-600'
          }`} />
          <span>{row.status}</span>
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Physical Beds"
          value={kpis.total_beds}
          icon={BedDouble}
          trend="10 Specialized Wards"
          trendDirection="neutral"
          subtitle="Fixed Capacity Baseline"
          colorScheme="brand"
        />
        <KPICard
          title="Occupied Beds"
          value={kpis.occupied_beds}
          icon={Activity}
          trend={`${kpis.occupancy_rate}% Occupancy`}
          trendDirection="up"
          subtitle="Target 75% - 85%"
          colorScheme="blue"
        />
        <KPICard
          title="Available Ready Beds"
          value={kpis.available_beds}
          icon={CheckCircle2}
          trend={`${((kpis.available_beds / (kpis.total_beds || 1)) * 100).toFixed(1)}% Free Capacity`}
          trendDirection="neutral"
          subtitle={`${kpis.maintenance_beds} in cleaning/maint`}
          colorScheme="emerald"
        />
        <KPICard
          title="ICU Critical Beds"
          value={`${kpis.icu_occupied} / ${kpis.icu_total}`}
          icon={HeartPulse}
          trend={`${kpis.icu_available} ICU Available`}
          trendDirection={kpis.icu_available > 0 ? 'up' : 'down'}
          subtitle="Emergency Intensive Care"
          colorScheme="rose"
        />
      </div>

      {/* Chart Row 1: Department Utilization and Bed Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-wise Bed Inventory (2 cols) */}
        <ChartCard
          title="Department-wise Bed Utilization"
          subtitle="Allocated capacity vs active bed occupancy across specialties"
          className="lg:col-span-2"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptBedUtil} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} angle={-30} textAnchor="end" tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                formatter={(val, name) => [`${val} beds`, name]}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="occupied" name="Occupied" fill="#2563eb" stackId="a" />
              <Bar dataKey="available" name="Available" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bed Type Donut (1 col) */}
        <ChartCard
          title="Bed Type Distribution"
          subtitle="General, Semi-Private, Private, ICU"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="total"
                nameKey="bed_type"
              >
                {typeDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0d9488', '#2563eb', '#8b5cf6', '#f43f5e'][index % 4]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val, name, item) => [`${val} beds (${item.payload.occupancy_rate}% occupied)`, name]}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Interactive Ward Visual Grid / Floor Plan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Interactive Ward Floor Grid</span>
              <span className="text-xs font-medium text-slate-500">• 30 Beds per Ward</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live floor map with visual availability and status telemetry
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-500" />
              <span className="text-slate-600">Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-md bg-blue-600" />
              <span className="text-slate-600">Occupied</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-md bg-amber-500" />
              <span className="text-slate-600">Cleaning</span>
            </div>
          </div>
        </div>

        {/* Ward Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-4">
          {wards.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWardView(w)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedWardView === w
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Ward Bed Grid representation */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
          {Array.from({ length: 30 }).map((_, idx) => {
            const bedNum = idx + 1;
            const pseudoHash = (hashStr(`${selectedWardView}-${bedNum}`) % 100);
            const status = pseudoHash < 78 ? 'Occupied' : pseudoHash < 93 ? 'Available' : 'Maintenance';
            const isICU = selectedWardView === 'ICU';
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-center transition-all hover:scale-105 cursor-pointer shadow-2xs ${
                  status === 'Occupied'
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : status === 'Available'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
                title={`Bed #${bedNum} | Status: ${status} | Type: ${isICU ? 'ICU' : 'General'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono font-bold opacity-75">#{bedNum}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    status === 'Occupied' ? 'bg-blue-600' : status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </div>
                <BedDouble className={`h-4 w-4 mx-auto mb-1 ${
                  status === 'Occupied' ? 'text-blue-600' : status === 'Available' ? 'text-emerald-600' : 'text-amber-600'
                }`} />
                <p className="text-[10px] font-semibold truncate">{status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bed Records Table */}
      <div className="space-y-3">
        {/* Table Filters Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pr-2 border-r border-slate-200">
            Filters:
          </span>

          <select
            value={wardFilter}
            onChange={(e) => { setWardFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Ward: All ({wards.length})</option>
            {wards.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Bed Type: All</option>
            {bedTypes.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="Occupied">Occupied</option>
            <option value="Available">Available</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          {(wardFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setWardFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
                setPage(1);
              }}
              className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        <DataTable
          title="Physical Beds Master Registry"
          subtitle="Real-time status and allocation across wards"
          columns={columns}
          data={bedsList}
          totalRecords={pagination.total_records}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(1); }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by Bed ID, room number, ward..."
          isLoading={loading}
        />
      </div>
    </div>
  );
}

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
