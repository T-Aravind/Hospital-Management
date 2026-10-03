import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarCheck, 
  Stethoscope, 
  BedDouble, 
  IndianRupee, 
  Clock, 
  Activity, 
  TrendingUp,
  Percent,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import KPICard, { formatIndianCurrency, formatCompactNumber } from '../components/common/KPICard';
import ChartCard from '../components/common/ChartCard';
import LoadingState, { SkeletonKPIGrid, SkeletonChartCard } from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import CustomTooltip, { chartTooltipProps } from '../components/common/CustomTooltip';

const CHART_COLORS = ['#0d9488', '#2563eb', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4', '#10b981', '#6366f1', '#ec4899', '#64748b'];

export default function Dashboard({ globalFilters, setGlobalFilters, metadata, onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendMetric, setTrendMetric] = useState('admissions'); // 'admissions' | 'revenue'

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getOverview({
        start_date: globalFilters.startDate,
        end_date: globalFilters.endDate,
        department: globalFilters.department,
        admission_type: globalFilters.admissionType,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch overview intelligence metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [globalFilters]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <SkeletonKPIGrid count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChartCard height="h-80" />
          <SkeletonChartCard height="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const kpis = data?.kpis || {};
  const monthlyTrend = data?.monthly_trend || [];
  const deptMetrics = data?.department_metrics || [];
  const bedUtil = data?.bed_utilization || [];
  const admissionTypes = data?.admission_type_dist || [];
  const recentAdmissions = data?.recent_admissions || [];
  const genderDist = data?.gender_dist || [];
  const ageDist = data?.age_dist || [];

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Admissions"
          value={kpis.total_admissions}
          icon={CalendarCheck}
          trend="+8.4% YoY"
          trendDirection="up"
          subtitle="Jan 2024 - Dec 2025"
          colorScheme="brand"
        />
        <KPICard
          title="Total Revenue Collected"
          value={kpis.total_revenue}
          isCurrency={true}
          icon={IndianRupee}
          trend="+12.1% YoY"
          trendDirection="up"
          subtitle={`Gross: ${formatIndianCurrency(kpis.total_gross_billed)}`}
          colorScheme="blue"
        />
        <KPICard
          title="Bed Occupancy Rate"
          value={kpis.bed_occupancy_rate}
          unit="%"
          icon={BedDouble}
          trend="Target 75-85%"
          trendDirection="neutral"
          subtitle={`${kpis.total_beds} Total Hospital Beds`}
          colorScheme="purple"
        />
        <KPICard
          title="Avg Length of Stay (ALOS)"
          value={kpis.average_length_of_stay}
          unit="Days"
          icon={Clock}
          trend="Target < 4.0d"
          trendDirection="down"
          subtitle={`Avg Wait: ${kpis.average_waiting_time} mins`}
          colorScheme="emerald"
        />
      </div>

      {/* Secondary Quick Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3 px-3 py-1 border-r border-slate-100 last:border-0">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Total Patients</p>
            <p className="text-sm font-bold text-slate-900">{kpis.total_patients?.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-3 py-1 border-r border-slate-100 last:border-0">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Active Doctors</p>
            <p className="text-sm font-bold text-slate-900">{kpis.total_doctors} Specialists</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-3 py-1 border-r border-slate-100 last:border-0">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Readmission Rate</p>
            <p className="text-sm font-bold text-slate-900">{kpis.readmission_rate}%</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-3 py-1">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Treatment Recovery</p>
            <p className="text-sm font-bold text-slate-900">{kpis.recovery_rate}% Success</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <ChartCard
          title="Hospital Admissions & Revenue Trajectory"
          subtitle="Monthly volume and revenue collection across 24 operational months"
          className="lg:col-span-2"
          height="h-80"
          actions={
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTrendMetric('admissions')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  trendMetric === 'admissions' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Admissions Volume
              </button>
              <button
                onClick={() => setTrendMetric('revenue')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  trendMetric === 'revenue' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Revenue (INR)
              </button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            {trendMetric === 'admissions' ? (
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <Tooltip {...chartTooltipProps} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="admissions" name="Total Admissions" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdmissions)" />
                <Area type="monotone" dataKey="emergencies" name="Emergency Triage" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorEmergency)" />
              </AreaChart>
            ) : (
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
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
                  formatter={(val) => [formatIndianCurrency(val), 'Revenue']}
                  {...chartTooltipProps}
                />
                <Area type="monotone" dataKey="revenue" name="Amount Paid" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="gross" name="Total Gross Billed" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        {/* Admission Type Breakdown (1 col) */}
        <ChartCard
          title="Triage & Admission Channel"
          subtitle="Emergency, Inpatient, and Outpatient share"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={admissionTypes}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="count"
                nameKey="type"
              >
                {admissionTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Main Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Volume & Revenue Breakdown (2 cols) */}
        <ChartCard
          title="Department-wise Clinical Volume"
          subtitle="Admissions distribution across 10 hospital specialties"
          className="lg:col-span-2"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptMetrics} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 11, fill: '#334155' }} tickLine={false} width={80} />
              <Tooltip 
                formatter={(val, name) => [val.toLocaleString(), name === 'admissions' ? 'Admissions' : name]}
                {...chartTooltipProps}
              />
              <Bar dataKey="admissions" name="Admissions" fill="#0d9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bed Capacity by Type (1 col) */}
        <ChartCard
          title="Bed Inventory by Category"
          subtitle="Physical Beds Allocation & Occupancy"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bedUtil} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bed_type" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                formatter={(val, name) => [`${val} beds`, name]}
                {...chartTooltipProps}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="occupied" name="Occupied" fill="#2563eb" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" name="Available" fill="#93c5fd" stackId="a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Admissions & Demographics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Admissions Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Recent Inpatient & Emergency Admissions</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Stream
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest admission records registered across departments
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('admissions')}
                className="flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Admission ID</th>
                  <th className="px-3 py-2.5">Patient</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Attending Doctor</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Room</th>
                  <th className="px-3 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAdmissions.map((adm) => (
                  <tr key={adm.admission_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-slate-900 font-mono text-[11px]">{adm.admission_id}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{adm.patient_name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{adm.department_name}</td>
                    <td className="px-3 py-2.5 text-slate-700">{adm.doctor_name}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        adm.admission_type === 'Emergency'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : adm.admission_type === 'Inpatient'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {adm.admission_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">{adm.room_number || adm.bed_id}</td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{adm.admission_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Patient Demographics Age Group & Gender (1 col) */}
        <ChartCard
          title="Patient Age Distribution"
          subtitle="Pediatric through Geriatric breakdown"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDist} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <Tooltip 
                formatter={(val, name, item) => [`${val.toLocaleString()} (${item.payload.percentage}%)`, 'Patients']}
                {...chartTooltipProps}
              />
              <Bar dataKey="count" name="Patients" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
