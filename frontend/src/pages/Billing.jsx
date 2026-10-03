import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  IndianRupee, 
  ShieldCheck, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

const COST_COLORS = ['#0d9488', '#3b82f6', '#8b5cf6'];
const INSURANCE_COLORS = ['#2563eb', '#f59e0b'];

export default function Billing({ globalFilters, metadata }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table filters & pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Amount_Paid');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBilling({
        page,
        page_size: pageSize,
        start_date: globalFilters.startDate,
        end_date: globalFilters.endDate,
        department: globalFilters.department,
        insurance: insuranceFilter !== 'all' ? insuranceFilter : undefined,
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch billing analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    page, 
    pageSize, 
    insuranceFilter, 
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
  const costBreakdown = data?.cost_breakdown || [];
  const deptRevenue = data?.dept_revenue || [];
  const monthlyRevenue = data?.monthly_revenue || [];
  const insuranceComparison = data?.insurance_comparison || [];
  const topBills = data?.top_bills || [];
  const billsList = data?.bills || [];
  const pagination = data?.pagination || { total_records: 0 };

  const columns = [
    {
      header: 'Bill ID',
      accessorKey: 'bill_id',
      sortable: true,
      cell: (row) => <span className="font-mono font-bold text-slate-900">{row.bill_id}</span>
    },
    {
      header: 'Admission ID',
      accessorKey: 'admission_id',
      sortable: true,
      cell: (row) => <span className="font-mono text-slate-600 text-xs">{row.admission_id}</span>
    },
    {
      header: 'Patient Details',
      accessorKey: 'patient_name',
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.patient_name}</p>
          <p className="text-[11px] text-slate-400">{row.doctor_name}</p>
        </div>
      )
    },
    {
      header: 'Department',
      accessorKey: 'department_name',
      cell: (row) => <span className="font-medium text-slate-800">{row.department_name}</span>
    },
    {
      header: 'Procedure & Tariff',
      accessorKey: 'treatment_cost',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.treatment_name}</p>
          <p className="text-[11px] text-slate-500">{formatIndianCurrency(row.treatment_cost)}</p>
        </div>
      )
    },
    {
      header: 'Pharmacy + Room',
      accessorKey: 'medicine_cost',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {formatIndianCurrency(row.medicine_cost)} + {formatIndianCurrency(row.room_charges)}
        </span>
      )
    },
    {
      header: 'Gross Bill',
      accessorKey: 'gross_bill',
      sortable: true,
      cell: (row) => <span className="font-mono font-semibold text-slate-700">{formatIndianCurrency(row.gross_bill)}</span>
    },
    {
      header: 'Insurance',
      accessorKey: 'insurance',
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          row.insurance === 'Yes'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {row.insurance === 'Yes' ? 'Insured (20% co-pay)' : 'Self-Pay (100%)'}
        </span>
      )
    },
    {
      header: 'Net Collected',
      accessorKey: 'amount_paid',
      sortable: true,
      cell: (row) => <span className="font-bold text-teal-700">{formatIndianCurrency(row.amount_paid)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue Collected"
          value={kpis.total_revenue_collected}
          isCurrency={true}
          icon={IndianRupee}
          trend="+12.1% YoY"
          trendDirection="up"
          subtitle={`Gross: ${formatIndianCurrency(kpis.total_gross_billed)}`}
          colorScheme="brand"
        />
        <KPICard
          title="Average Realized Bill"
          value={kpis.average_bill}
          isCurrency={true}
          icon={Receipt}
          trend="Per Hospital Admission"
          trendDirection="neutral"
          subtitle={`Gross Avg: ${formatIndianCurrency(kpis.average_gross)}`}
          colorScheme="blue"
        />
        <KPICard
          title="Insurance Penetration"
          value={kpis.insurance_rate}
          unit="%"
          icon={ShieldCheck}
          trend="Target > 60.0%"
          trendDirection="up"
          subtitle={`Collected: ${formatIndianCurrency(kpis.insured_collected)}`}
          colorScheme="purple"
        />
        <KPICard
          title="Self-Pay Direct Collections"
          value={kpis.self_pay_collected}
          isCurrency={true}
          icon={CreditCard}
          trend="Out-of-Pocket"
          trendDirection="neutral"
          subtitle="Uninsured Patient Co-pays"
          colorScheme="amber"
        />
      </div>

      {/* Main Charts Row 1: Monthly Revenue Trajectory & Cost Component Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend (2 cols) */}
        <ChartCard
          title="Monthly Revenue Realization vs Gross Billed"
          subtitle="Collected Amount Paid vs Total Incurred Tariff"
          className="lg:col-span-2"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
                tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
              />
              <Tooltip 
                formatter={(val, name) => [formatIndianCurrency(val), name]}
                {...chartTooltipProps}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="collected" name="Net Collected (Amount Paid)" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
              <Area type="monotone" dataKey="gross" name="Total Gross Billed" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorGross)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cost Breakdown Donut (1 col) */}
        <ChartCard
          title="Hospital Tariff Cost Breakdown"
          subtitle="Proportion of clinical, pharmacy, and bed charges"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="amount"
                nameKey="category"
              >
                {costBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COST_COLORS[index % COST_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2: Department-wise Revenue and Top High-Billing Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Revenue Breakdown */}
        <ChartCard
          title="Department-wise Revenue Realization"
          subtitle="Total Collections generated across 10 medical specialties"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptRevenue} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                tickLine={false} 
                tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
              />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#334155' }} tickLine={false} width={100} />
              <Tooltip 
                formatter={(val, name, item) => [
                  name === 'collected' ? `${formatIndianCurrency(val)} (Avg ${formatIndianCurrency(item.payload.avg_bill)})` : formatIndianCurrency(val),
                  name === 'collected' ? 'Net Collections' : 'Gross Billed'
                ]}
                {...chartTooltipProps}
              />
              <Bar dataKey="collected" name="Net Collections" fill="#0d9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Insurance vs Self-Pay Comparative Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Insurance vs Self-Pay Revenue Dynamics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Settlement comparison and co-payment realization breakdown
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center space-x-2 text-blue-700 mb-2">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-bold text-xs">Insured Admissions (65%)</span>
              </div>
              <p className="text-2xl font-extrabold text-blue-900 mb-1">
                {formatIndianCurrency(kpis.insured_collected)}
              </p>
              <p className="text-xs text-blue-700">
                20% Patient Co-Pay Realization • 80% Payer Covered
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
              <div className="flex items-center space-x-2 text-amber-700 mb-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-bold text-xs">Self-Pay Admissions (35%)</span>
              </div>
              <p className="text-2xl font-extrabold text-amber-900 mb-1">
                {formatIndianCurrency(kpis.self_pay_collected)}
              </p>
              <p className="text-xs text-amber-700">
                100% Out-of-Pocket Direct Cash/Card Settlement
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <span>Overall Billed Recovery Rate:</span>
            <strong className="text-slate-900">
              {((kpis.total_revenue_collected / (kpis.total_gross_billed || 1)) * 100).toFixed(1)}% of Gross Tariff
            </strong>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-3">
        {/* Table Filters Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pr-2 border-r border-slate-200">
            Filters:
          </span>

          <select
            value={insuranceFilter}
            onChange={(e) => { setInsuranceFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">Insurance: All</option>
            <option value="Yes">Insured (20% co-pay)</option>
            <option value="No">Self-Pay (100%)</option>
          </select>

          {(insuranceFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setInsuranceFilter('all');
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
          title="Hospital Billing Transactions & Claims Ledger"
          subtitle="Itemized tariffs, medicine costs, and payment settlements"
          columns={columns}
          data={billsList}
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
          searchPlaceholder="Search by Bill ID, patient, doctor, procedure..."
          isLoading={loading}
        />
      </div>
    </div>
  );
}
