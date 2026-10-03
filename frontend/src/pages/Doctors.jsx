import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Award, 
  IndianRupee, 
  Activity, 
  GraduationCap, 
  Users, 
  HeartHandshake,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
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

export default function Doctors({ globalFilters, metadata }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table filters & pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('admissions_handled');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDoctors({
        page,
        page_size: pageSize,
        department: globalFilters.department,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch doctor analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, genderFilter, sortBy, sortOrder, globalFilters.department]);

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
      setSortOrder('desc');
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
  const deptDoctorCount = data?.dept_doctor_count || [];
  const topRevenueDoctors = data?.top_revenue_doctors || [];
  const expRevenueScatter = data?.exp_revenue_scatter || [];
  const doctorsList = data?.doctors || [];
  const pagination = data?.pagination || { total_records: 0 };

  const columns = [
    {
      header: 'Doctor ID',
      accessorKey: 'doctor_id',
      sortable: true,
      cell: (row) => <span className="font-mono font-bold text-slate-900">{row.doctor_id}</span>
    },
    {
      header: 'Physician Name',
      accessorKey: 'doctor_name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.doctor_name}</p>
          <p className="text-[11px] text-slate-400">{row.gender} • {row.qualification}</p>
        </div>
      )
    },
    {
      header: 'Specialty Department',
      accessorKey: 'department_name',
      sortable: true,
      cell: (row) => <span className="font-medium text-slate-800">{row.department_name}</span>
    },
    {
      header: 'Experience',
      accessorKey: 'experience_years',
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
          {row.experience_years} yrs
        </span>
      )
    },
    {
      header: 'Consultation Fee',
      accessorKey: 'consultation_fee',
      sortable: true,
      cell: (row) => <span className="font-semibold text-slate-900">₹{row.consultation_fee}</span>
    },
    {
      header: 'Caseload',
      accessorKey: 'admissions_handled',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.admissions_handled} cases</span>
          <p className="text-[10px] text-slate-400">{row.surgeries_performed} Surgeries</p>
        </div>
      )
    },
    {
      header: 'Recovery Rate',
      accessorKey: 'recovery_rate',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          {row.recovery_rate}%
        </span>
      )
    },
    {
      header: 'Revenue Contribution',
      accessorKey: 'revenue_generated',
      sortable: true,
      cell: (row) => <span className="font-bold text-teal-700">{formatIndianCurrency(row.revenue_generated)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Medical Consultants"
          value={kpis.total_doctors}
          icon={Stethoscope}
          trend="80 Clinical Specialists"
          trendDirection="neutral"
          subtitle={`${kpis.male_doctors} Male / ${kpis.female_doctors} Female`}
          colorScheme="brand"
        />
        <KPICard
          title="Average Experience"
          value={kpis.average_experience}
          unit="Years"
          icon={Award}
          trend="Senior Clinical Roster"
          trendDirection="up"
          subtitle="Range 2 to 30 yrs"
          colorScheme="blue"
        />
        <KPICard
          title="Avg Consultation Tariff"
          value={`₹${kpis.average_consultation_fee}`}
          icon={IndianRupee}
          trend="Tiered by Seniority"
          trendDirection="neutral"
          subtitle="₹500 - ₹1,800 Scale"
          colorScheme="purple"
        />
        <KPICard
          title="Total Surgeries Performed"
          value={kpis.total_surgeries}
          icon={Activity}
          trend="Major & Minor Procedures"
          trendDirection="up"
          subtitle={`Avg Rev: ${formatIndianCurrency(kpis.average_revenue_per_doctor)}`}
          colorScheme="emerald"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Revenue Doctors */}
        <ChartCard
          title="Top 10 Clinical Revenue Leaders"
          subtitle="Highest financial contribution by physician"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRevenueDoctors} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                tickLine={false} 
                tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
              />
              <YAxis dataKey="doctor_name" type="category" tick={{ fontSize: 10, fill: '#334155' }} tickLine={false} width={100} />
              <Tooltip 
                formatter={(val) => [formatIndianCurrency(val), 'Revenue']}
                {...chartTooltipProps}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#0d9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Department-wise Doctor Count & Revenue */}
        <ChartCard
          title="Specialty Physician Allocation"
          subtitle="Consultant count across hospital departments"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptDoctorCount} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} angle={-30} textAnchor="end" tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                formatter={(val, name, item) => [`${val} physicians (Avg ${item.payload.avg_experience}y exp)`, 'Count']}
                {...chartTooltipProps}
              />
              <Bar dataKey="count" name="Doctors" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Table Section */}
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

          {(genderFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setGenderFilter('all');
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
          title="Physician Directory & Performance Roster"
          subtitle="Detailed caseloads, surgical intervention rates, and revenue generation"
          columns={columns}
          data={doctorsList}
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
          searchPlaceholder="Search by doctor name, qualification, ID..."
          isLoading={loading}
        />
      </div>
    </div>
  );
}
