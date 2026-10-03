import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  CheckCircle2, 
  Activity, 
  AlertCircle, 
  Syringe, 
  Scissors,
  TrendingUp,
  Stethoscope
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
import CustomTooltip, { chartTooltipProps } from '../components/common/CustomTooltip';

const OUTCOME_COLORS = {
  Recovered: '#10b981',
  Improved: '#3b82f6',
  Referred: '#f59e0b',
  Deceased: '#ef4444',
};

export default function Treatments({ globalFilters, metadata }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table pagination and filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [surgeryFilter, setSurgeryFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Treatment_ID');
  const [sortOrder, setSortOrder] = useState('asc');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTreatments({
        page,
        page_size: pageSize,
        department: globalFilters.department,
        surgery: surgeryFilter !== 'all' ? surgeryFilter : undefined,
        outcome: outcomeFilter !== 'all' ? outcomeFilter : undefined,
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch treatment analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, surgeryFilter, outcomeFilter, sortBy, sortOrder, globalFilters.department]);

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
  const outcomeDist = data?.outcome_dist || [];
  const topTreatments = data?.top_treatments || [];
  const deptTreatments = data?.dept_treatments || [];
  const surgeryOutcomeComparison = data?.surgery_outcome_comparison || [];
  const treatmentsList = data?.treatments || [];
  const pagination = data?.pagination || { total_records: 0 };

  const columns = [
    {
      header: 'Treatment ID',
      accessorKey: 'treatment_id',
      sortable: true,
      cell: (row) => <span className="font-mono font-bold text-slate-900">{row.treatment_id}</span>
    },
    {
      header: 'Admission ID',
      accessorKey: 'admission_id',
      sortable: true,
      cell: (row) => <span className="font-mono text-slate-600 text-xs">{row.admission_id}</span>
    },
    {
      header: 'Patient Name',
      accessorKey: 'patient_name',
      cell: (row) => <span className="font-medium text-slate-900">{row.patient_name}</span>
    },
    {
      header: 'Attending Doctor',
      accessorKey: 'doctor_name',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.doctor_name}</p>
          <p className="text-[11px] text-slate-400">{row.department_name}</p>
        </div>
      )
    },
    {
      header: 'Procedure / Therapy',
      accessorKey: 'treatment_name',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
          <Syringe className="h-3.5 w-3.5 text-teal-600" />
          <span>{row.treatment_name}</span>
        </span>
      )
    },
    {
      header: 'Surgical?',
      accessorKey: 'surgery',
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.surgery === 'Yes'
            ? 'bg-purple-50 text-purple-700 border border-purple-200'
            : 'bg-slate-50 text-slate-600 border border-slate-200'
        }`}>
          {row.surgery === 'Yes' ? 'Surgical' : 'Non-Surgical'}
        </span>
      )
    },
    {
      header: 'Clinical Outcome',
      accessorKey: 'outcome',
      sortable: true,
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          row.outcome === 'Recovered'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : row.outcome === 'Improved'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : row.outcome === 'Referred'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {row.outcome}
        </span>
      )
    },
    {
      header: 'Tariff Cost',
      accessorKey: 'treatment_cost',
      sortable: true,
      cell: (row) => <span className="font-semibold text-slate-900">{formatIndianCurrency(row.treatment_cost)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Treatments Performed"
          value={kpis.total_treatments}
          icon={HeartPulse}
          trend="15,000 Procedures"
          trendDirection="neutral"
          subtitle="Medical & Surgical Interventions"
          colorScheme="brand"
        />
        <KPICard
          title="Clinical Recovery Rate"
          value={kpis.recovery_rate}
          unit="%"
          icon={CheckCircle2}
          trend="Target > 70.0%"
          trendDirection="up"
          subtitle="Full Clinical Recovery"
          colorScheme="emerald"
        />
        <KPICard
          title="Surgical Intervention Rate"
          value={kpis.surgery_rate}
          unit="%"
          icon={Scissors}
          trend={`${kpis.surgery_count?.toLocaleString()} Surgeries`}
          trendDirection="neutral"
          subtitle="Major & Minor Operations"
          colorScheme="purple"
        />
        <KPICard
          title="Mortality Rate"
          value={kpis.mortality_rate}
          unit="%"
          icon={AlertCircle}
          trend="Target < 3.5%"
          trendDirection="down"
          subtitle={`Referred: ${kpis.referred_rate}%`}
          colorScheme="rose"
        />
      </div>

      {/* Charts Row 1: Outcomes Donut & Top Treatments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Donut (1 col) */}
        <ChartCard
          title="Clinical Outcomes Distribution"
          subtitle="Proportion of patient recovery and therapeutic outcomes"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={outcomeDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="count"
                nameKey="outcome"
              >
                {outcomeDist.map((entry) => (
                  <Cell key={`cell-${entry.outcome}`} fill={OUTCOME_COLORS[entry.outcome] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 10 Treatments & Procedures (2 cols) */}
        <ChartCard
          title="Top 10 Clinical Procedures & Tariffs"
          subtitle="Frequency, surgical classification, and recovery rates"
          className="lg:col-span-2"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topTreatments} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis dataKey="treatment_name" type="category" tick={{ fontSize: 10, fill: '#334155' }} tickLine={false} width={110} />
              <Tooltip 
                formatter={(val, name, item) => [
                  name === 'count' ? `${val.toLocaleString()} procedures (${item.payload.recovery_rate}% Recovery)` : val,
                  name === 'count' ? 'Procedures' : name
                ]}
                {...chartTooltipProps}
              />
              <Bar dataKey="count" name="Procedures" fill="#0d9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Chart Row 2: Department-wise Treatments and Surgical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Treatments Split */}
        <ChartCard
          title="Department-wise Treatment & Surgery Volumes"
          subtitle="Surgical vs Non-Surgical procedures across specialties"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptTreatments} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} angle={-30} textAnchor="end" tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip {...chartTooltipProps} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="surgeries" name="Surgical" fill="#8b5cf6" stackId="a" />
              <Bar dataKey="non_surgeries" name="Non-Surgical" fill="#0d9488" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Surgical vs Non-Surgical Outcome Comparison */}
        <ChartCard
          title="Surgical vs Non-Surgical Outcomes"
          subtitle="Relative outcome percentages across intervention types"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={surgeryOutcomeComparison} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit="%" />
              <Tooltip 
                formatter={(val, name) => [`${val}%`, name]}
                {...chartTooltipProps}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="recovered" name="Recovered" fill="#10b981" />
              <Bar dataKey="improved" name="Improved" fill="#3b82f6" />
              <Bar dataKey="referred" name="Referred" fill="#f59e0b" />
              <Bar dataKey="deceased" name="Deceased" fill="#ef4444" />
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
            value={surgeryFilter}
            onChange={(e) => { setSurgeryFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Procedure: All</option>
            <option value="Yes">Surgical</option>
            <option value="No">Non-Surgical</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Outcome: All</option>
            <option value="Recovered">Recovered</option>
            <option value="Improved">Improved</option>
            <option value="Referred">Referred</option>
            <option value="Deceased">Deceased</option>
          </select>

          {(surgeryFilter !== 'all' || outcomeFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSurgeryFilter('all');
                setOutcomeFilter('all');
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
          title="Clinical Treatments & Interventions Registry"
          subtitle="Procedure details, surgical indicators, and outcome tracking"
          columns={columns}
          data={treatmentsList}
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
          searchPlaceholder="Search by procedure, patient, doctor..."
          isLoading={loading}
        />
      </div>
    </div>
  );
}
