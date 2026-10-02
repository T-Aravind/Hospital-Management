import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function ChartCard({
  title,
  subtitle,
  badge,
  icon: Icon,
  actions,
  children,
  className = '',
  height = 'h-72',
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card transition-shadow p-5 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-2 border-b border-slate-100">
        <div className="flex items-start space-x-2.5">
          {Icon && (
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>

      {/* Chart Body */}
      <div className={`w-full ${height} relative flex items-center justify-center`}>
        {children}
      </div>
    </div>
  );
}
