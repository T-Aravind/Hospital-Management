import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  Activity, 
  AlertTriangle, 
  DoorOpen,
  TrendingUp,
  Stethoscope,
  BedDouble,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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

const TYPE_COLORS = ['#f43f5e', '#2563eb', '#10b981'];

export default function Admissions({ globalFilters, metadata }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table pagination and filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [admissionTypeFilter, setAdmissionTypeFilter] = useState(globalFilters.admissionType || 'all');
  const [readmissionFilter, setReadmissionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Admission_Date');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdmissions({
        page,
        page_size: pageSize,
        start_date: globalFilters.startDate,
        end_date: globalFilters.endDate,
        department: globalFilters.department,
        admission_type: admissionTypeFilter !== 'all' ? admissionTypeFilter : undefined,
        readmission: readmissionFilter !== 'all' ? readmissionFilter : undefined,
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch admissions intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    page, 
    pageSize, 
    admissionTypeFilter, 
    readmissionFilter, 
    sortBy, 
    sortOrder, 
    globalFilters.startDate, 
    globalFilters.endDate, 
    globalFilters.department
  ]);

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
  const monthlyTrend = data?.monthly_trend || [];
  const deptAdmissions = data?.department_admissions || [];
  const typeDist = data?.admission_type_dist || [];
  const losDist = data?.los_distribution || [];
  const admissionsList = data?.admissions || [];
  const pagination = data?.pagination || { total_records: 0 };

  const columns = [
    {
      header: 'Admission ID',
      accessorKey: 'admission_id',
      sortable: true,
      cell: (row) => <span className="font-mono font-semibold text-slate-900">{row.admission_id}</span>
    },
    {
      header: 'Patient Details',
      accessorKey: 'patient_name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.patient_name}</p>
          <p className="text-[11px] text-slate-400">{row.patient_id} • {row.gender}, {row.age}y</p>
        </div>
      )
    },
    {
      header: 'Diagnosis / Disease',
      accessorKey: 'disease',
      sortable: true,
      cell: (row) => <span className="font-medium text-slate-800">{row.disease}</span>
    },
    {
      header: 'Department & Doctor',
      accessorKey: 'department_name',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.department_name}</p>
          <p className="text-[11px] text-slate-500">{row.doctor_name}</p>
        </div>
      )
    },
    {
      header: 'Triage Type',
      accessorKey: 'admission_type',
      sortable: true,
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
          row.admission_type === 'Emergency'
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : row.admission_type === 'Inpatient'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {row.admission_type}
        </span>
      )
    },
    {
      header: 'Bed / Room',
      accessorKey: 'room_number',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.room_number || '-'} <span className="text-slate-400">({row.bed_type})</span>
        </span>
      )
    },
    {
      header: 'Admission Date',
      accessorKey: 'admission_date',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="text-slate-900 font-medium">{row.admission_date}</p>
          <p className="text-[11px] text-slate-400">{row.admission_time}</p>
        </div>
      )
    },
    {
      header: 'LOS',
      accessorKey: 'length_of_stay',
      sortable: true,
      cell: (row) => (
        <span className={`font-semibold ${row.length_of_stay > 5 ? 'text-amber-600' : 'text-slate-700'}`}>
          {row.length_of_stay} d
        </span>
      )
    },
    {
      header: 'Wait Time',
      accessorKey: 'waiting_time_minutes',
      sortable: true,
      cell: (row) => (
        <span className={`text-xs ${row.waiting_time_minutes > 45 ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
          {row.waiting_time_minutes} min
        </span>
      )
    },
    {
      header: 'Readmission',
      accessorKey: 'readmission',
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.readmission === 'Yes'
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-slate-50 text-slate-500 border border-slate-200'
        }`}>
          {row.readmission}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Admissions"
          value={kpis.total_admissions}
          icon={CalendarCheck}
          trend="24 Months Trajectory"
          trendDirection="neutral"
          subtitle="Jan 2024 - Dec 2025"
          colorScheme="brand"
        />
        <KPICard
          title="Emergency Admissions"
          value={kpis.emergency_count}
          unit={`(${kpis.emergency_ratio}%)`}
          icon={AlertTriangle}
          trend="Critical Triage Channel"
          trendDirection="up"
          subtitle="Avg Wait: 12.8 mins"
          colorScheme="rose"
        />
        <KPICard
          title="Average Length of Stay"
          value={kpis.average_length_of_stay}
          unit="Days"
          icon={Clock}
          trend="Optimal: < 4.0 Days"
          trendDirection="down"
          subtitle="Inpatient Turnover Rate"
          colorScheme="blue"
        />
        <KPICard
          title="30-Day Readmission Rate"
          value={kpis.readmission_rate}
          unit="%"
          icon={Activity}
          trend="Benchmark < 10.0%"
          trendDirection="neutral"
          subtitle="Post-Discharge Quality"
          colorScheme="amber"
        />
      </div>

      {/* Chart Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Admission Breakdown (2 cols) */}
        <ChartCard
          title="Monthly Admission Channels Breakdown"
          subtitle="Emergency, Inpatient, and Outpatient volume trajectory"
          className="lg:col-span-2"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="emergency" name="Emergency" fill="#f43f5e" stackId="a" />
              <Bar dataKey="inpatient" name="Inpatient" fill="#2563eb" stackId="a" />
              <Bar dataKey="outpatient" name="Outpatient" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Admission Type Donut (1 col) */}
        <ChartCard
          title="Admission Channel Distribution"
          subtitle="Share of overall triage admissions"
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
                dataKey="count"
                nameKey="type"
              >
                {typeDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val, name, item) => [`${val.toLocaleString()} (${item.payload.percentage}%)`, name]}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Chart Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Length of Stay Distribution */}
        <ChartCard
          title="Length of Stay (ALOS) Distribution"
          subtitle="Patient duration in days from check-in to discharge"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={losDist} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                formatter={(val, name, item) => [`${val.toLocaleString()} admissions (${item.payload.percentage}%)`, 'Admissions']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="count" name="Admissions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Department-wise Admissions and Readmission Rate */}
        <ChartCard
          title="Specialty Admissions & Readmission Rates"
          subtitle="Department volume vs 30-day readmission percentage"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptAdmissions} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} angle={-30} textAnchor="end" tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#f59e0b' }} tickLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="count" name="Admissions" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="readmission_rate" name="Readmission Rate %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
            value={admissionTypeFilter}
            onChange={(e) => { setAdmissionTypeFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Admission Type: All</option>
            <option value="Emergency">Emergency</option>
            <option value="Inpatient">Inpatient</option>
            <option value="Outpatient">Outpatient</option>
          </select>

          <select
            value={readmissionFilter}
            onChange={(e) => { setReadmissionFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Readmission: All</option>
            <option value="Yes">Readmitted (Yes)</option>
            <option value="No">No Readmission (No)</option>
          </select>

          {(admissionTypeFilter !== 'all' || readmissionFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setAdmissionTypeFilter('all');
                setReadmissionFilter('all');
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
          title="Admission Records & Triage Registry"
          subtitle="Detailed transactional hospital admissions data"
          columns={columns}
          data={admissionsList}
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
          searchPlaceholder="Search by patient name, ID, disease, doctor..."
          isLoading={loading}
        />
      </div>
    </div>
  );
}
