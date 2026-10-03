import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  MapPin, 
  Droplet, 
  Search, 
  HeartHandshake,
  Calendar,
  Layers,
  ArrowUpDown
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
import KPICard, { formatIndianCurrency } from '../components/common/KPICard';
import ChartCard from '../components/common/ChartCard';
import DataTable from '../components/common/DataTable';
import LoadingState, { SkeletonKPIGrid, SkeletonChartCard } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import CustomTooltip, { chartTooltipProps } from '../components/common/CustomTooltip';

const GENDER_COLORS = ['#2563eb', '#ec4899'];
const PALETTE = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#14b8a6'];

export default function Patients({ globalFilters, metadata }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table filters & pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Patient_ID');
  const [sortOrder, setSortOrder] = useState('asc');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPatients({
        page,
        page_size: pageSize,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        blood_group: bloodFilter !== 'all' ? bloodFilter : undefined,
        city: cityFilter !== 'all' ? cityFilter : undefined,
        department: globalFilters.department,
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch patient analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, genderFilter, bloodFilter, cityFilter, sortBy, sortOrder, globalFilters.department]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      loadData();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPage(1);
  };

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
  const genderDist = data?.gender_dist || [];
  const ageDist = data?.age_dist || [];
  const bloodDist = data?.blood_dist || [];
  const cityDist = data?.city_dist || [];
  const deptPatientDist = data?.department_patient_dist || [];
  const patientsList = data?.patients || [];
  const pagination = data?.pagination || { total_records: 0 };
  const cities = data?.cities || [];
  const bloodGroups = data?.blood_groups || [];

  const columns = [
    {
      header: 'Patient ID',
      accessorKey: 'patient_id',
      sortable: true,
      cell: (row) => <span className="font-mono font-semibold text-slate-900">{row.patient_id}</span>
    },
    {
      header: 'Patient Name',
      accessorKey: 'patient_name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.patient_name}</p>
          <p className="text-[11px] text-slate-400">{row.phone}</p>
        </div>
      )
    },
    {
      header: 'Demographics',
      accessorKey: 'age',
      sortable: true,
      cell: (row) => (
        <span className="text-slate-700">
          {row.age} yrs • <span className={row.gender === 'Female' ? 'text-pink-600' : 'text-blue-600'}>{row.gender}</span>
        </span>
      )
    },
    {
      header: 'Blood Group',
      accessorKey: 'blood_group',
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
          {row.blood_group}
        </span>
      )
    },
    {
      header: 'City Catchment',
      accessorKey: 'city',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center space-x-1 text-slate-700">
          <MapPin className="h-3 w-3 text-slate-400" />
          <span>{row.city}</span>
        </span>
      )
    },
    {
      header: 'Department',
      accessorKey: 'last_department',
      cell: (row) => <span className="text-slate-700 font-medium">{row.last_department}</span>
    },
    {
      header: 'Total Visits',
      accessorKey: 'total_visits',
      sortable: true,
      cell: (row) => <span className="font-semibold text-slate-900">{row.total_visits}</span>
    },
    {
      header: 'Total Paid',
      accessorKey: 'total_spent',
      sortable: true,
      cell: (row) => <span className="font-bold text-teal-700">{formatIndianCurrency(row.total_spent)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Patient KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Registered Patients"
          value={kpis.total_patients}
          icon={Users}
          trend="100% Synthetic Demo"
          trendDirection="neutral"
          subtitle="Master Patient Registry"
          colorScheme="brand"
        />
        <KPICard
          title="Average Patient Age"
          value={kpis.average_age}
          unit="Years"
          icon={UserCheck}
          trend="Pediatric to Geriatric"
          trendDirection="neutral"
          subtitle="Median Range 35-50 yrs"
          colorScheme="blue"
        />
        <KPICard
          title="Male vs Female Ratio"
          value={`${((kpis.male_count / maxVal(kpis.total_patients, 1)) * 100).toFixed(1)}% / ${((kpis.female_count / maxVal(kpis.total_patients, 1)) * 100).toFixed(1)}%`}
          icon={HeartHandshake}
          trend="Equitable Access"
          trendDirection="up"
          subtitle={`${kpis.male_count?.toLocaleString()} M / ${kpis.female_count?.toLocaleString()} F`}
          colorScheme="purple"
        />
        <KPICard
          title="Primary Regional Hub"
          value={kpis.top_city}
          icon={MapPin}
          trend="Catchment Area"
          trendDirection="neutral"
          subtitle={`${kpis.unique_cities} Urban Centers Served`}
          colorScheme="emerald"
        />
      </div>

      {/* Demographics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Pyramid / Distribution (2 cols) */}
        <ChartCard
          title="Patient Age Distribution"
          subtitle="10-year cohort breakdown across 15,000 patients"
          className="lg:col-span-2"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDist} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="age_group" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                formatter={(val, name, item) => [`${val.toLocaleString()} patients (${item.payload.percentage}%)`, 'Count']}
                {...chartTooltipProps}
              />
              <Bar dataKey="count" name="Patients" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gender Distribution Donut (1 col) */}
        <ChartCard
          title="Gender Representation"
          subtitle="Demographic split"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="count"
                nameKey="gender"
              >
                {genderDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Regional & Blood Groups Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Distribution (Horizontal Bar) */}
        <ChartCard
          title="Top Patient Origins by City"
          subtitle="Primary regional outreach and catchment centers"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityDist} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis dataKey="city" type="category" tick={{ fontSize: 11, fill: '#334155' }} tickLine={false} width={80} />
              <Tooltip 
                formatter={(val, name, item) => [`${val.toLocaleString()} patients (${item.payload.percentage}%)`, 'Volume']}
                {...chartTooltipProps}
              />
              <Bar dataKey="count" name="Patients" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Blood Group Distribution */}
        <ChartCard
          title="Blood Group Distribution"
          subtitle="Patient blood bank reserves & emergency matching profile"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bloodDist} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="blood_group" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                formatter={(val, name, item) => [`${val.toLocaleString()} (${item.payload.percentage}%)`, 'Patients']}
                {...chartTooltipProps}
              />
              <Bar dataKey="count" name="Patients" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Patient Interactive Directory Table */}
      <div className="space-y-3">
        {/* Table Filters Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pr-2 border-r border-slate-200">
            Filters:
          </span>

          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Gender: All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={bloodFilter}
            onChange={(e) => { setBloodFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Blood Group: All</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">City: All ({cities.length})</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(genderFilter !== 'all' || bloodFilter !== 'all' || cityFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setGenderFilter('all');
                setBloodFilter('all');
                setCityFilter('all');
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
          title="Patient Master Registry"
          subtitle="Search, filter, and inspect detailed patient records"
          columns={columns}
          data={patientsList}
          totalRecords={pagination.total_records}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(1); }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by patient name, ID, phone, city..."
          isLoading={loading}
        />
      </div>
    </div>
  );
}

function maxVal(a, b) {
  return a > b ? a : b;
}
