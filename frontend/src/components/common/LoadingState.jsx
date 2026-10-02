import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading intelligence metrics...' }) {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-glow">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-800">{message}</p>
        <p className="text-xs text-slate-400 mt-0.5">Aggregating hospital operations records</p>
      </div>
    </div>
  );
}

export function SkeletonKPIGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="h-3.5 bg-slate-200 rounded w-1/2" />
            <div className="h-9 w-9 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-8 bg-slate-200 rounded w-3/4 mb-4" />
          <div className="h-3 bg-slate-100 rounded w-1/3 pt-2 border-t border-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChartCard({ height = 'h-72' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse">
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
        <div className="space-y-1.5 w-1/3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-8 w-24 bg-slate-100 rounded-xl" />
      </div>
      <div className={`w-full ${height} bg-slate-50 rounded-xl flex items-center justify-center`}>
        <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
      </div>
    </div>
  );
}
