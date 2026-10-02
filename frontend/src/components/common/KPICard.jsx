import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export function formatIndianCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${Number(num).toLocaleString('en-IN')}`;
}

export function formatCompactNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${Number(num).toLocaleString('en-IN')}`;
  }
  return String(num);
}

export default function KPICard({
  title,
  value,
  unit = '',
  isCurrency = false,
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  trendLabel = '',
  subtitle,
  icon: Icon,
  colorScheme = 'brand', // 'brand' | 'blue' | 'indigo' | 'purple' | 'amber' | 'rose' | 'emerald' | 'cyan'
}) {
  const colorStyles = {
    brand: {
      bg: 'from-teal-500/10 to-teal-600/5',
      border: 'border-teal-100 hover:border-teal-300',
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
      accent: 'text-teal-700',
      glow: 'group-hover:shadow-teal-500/10',
    },
    blue: {
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'text-blue-700',
      glow: 'group-hover:shadow-blue-500/10',
    },
    indigo: {
      bg: 'from-indigo-500/10 to-indigo-600/5',
      border: 'border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accent: 'text-indigo-700',
      glow: 'group-hover:shadow-indigo-500/10',
    },
    purple: {
      bg: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accent: 'text-purple-700',
      glow: 'group-hover:shadow-purple-500/10',
    },
    amber: {
      bg: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'text-amber-700',
      glow: 'group-hover:shadow-amber-500/10',
    },
    rose: {
      bg: 'from-rose-500/10 to-rose-600/5',
      border: 'border-rose-100 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'text-rose-700',
      glow: 'group-hover:shadow-rose-500/10',
    },
    emerald: {
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'text-emerald-700',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    cyan: {
      bg: 'from-cyan-500/10 to-cyan-600/5',
      border: 'border-cyan-100 hover:border-cyan-300',
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
      accent: 'text-cyan-700',
      glow: 'group-hover:shadow-cyan-500/10',
    },
  };

  const currentTheme = colorStyles[colorScheme] || colorStyles.brand;

  const displayValue = isCurrency 
    ? formatIndianCurrency(value)
    : typeof value === 'number' 
      ? `${Number(value).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`
      : `${value || '0'}${unit ? ` ${unit}` : ''}`;

  return (
    <div className={`group bg-white rounded-2xl p-5 border ${currentTheme.border} shadow-xs hover:shadow-card-hover transition-all duration-300 relative overflow-hidden flex flex-col justify-between`}>
      {/* Background Subtle Gradient */}
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-br ${currentTheme.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </span>
          {Icon && (
            <div className={`p-2.5 rounded-xl border ${currentTheme.iconBg} shadow-xs group-hover:scale-105 transition-transform`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="flex items-baseline space-x-1.5 mb-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {displayValue}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        {trend && (
          <div className={`flex items-center space-x-1 font-semibold ${
            trendDirection === 'up' 
              ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md' 
              : trendDirection === 'down' 
                ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md' 
                : 'text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md'
          }`}>
            {trendDirection === 'up' && <TrendingUp className="h-3 w-3" />}
            {trendDirection === 'down' && <TrendingDown className="h-3 w-3" />}
            {trendDirection === 'neutral' && <Minus className="h-3 w-3" />}
            <span>{trend}</span>
          </div>
        )}
        {trendLabel && !trend && (
          <span className="text-slate-400 font-medium">{trendLabel}</span>
        )}
        {subtitle && (
          <span className="text-slate-500 text-[11px] font-medium truncate ml-auto">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
