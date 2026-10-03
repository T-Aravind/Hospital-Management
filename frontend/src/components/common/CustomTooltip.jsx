import React from 'react';

/**
 * Premium glassmorphic tooltip for all Recharts charts across the dashboard.
 * Ensures 100% crystal-clear visibility, high contrast white text on dark background,
 * styled badges, and formatted values.
 */
export function CustomTooltip({ active, payload, label, formatter, valuePrefix = '', valueSuffix = '' }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-2xl text-xs min-w-[140px] z-50">
      {label && (
        <div className="font-semibold text-slate-300 pb-1.5 mb-1.5 border-b border-slate-800 text-[11px] tracking-wide">
          {label}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const color = item.color || item.payload?.fill || item.fill || '#38bdf8';
          const name = item.name || item.dataKey || item.payload?.name || item.payload?.outcome || item.payload?.department || 'Value';
          
          let displayValue = item.value;
          let extraInfo = '';

          if (formatter) {
            const formatted = formatter(item.value, name, item);
            if (Array.isArray(formatted)) {
              displayValue = formatted[0];
            } else {
              displayValue = formatted;
            }
          } else if (item.payload?.percentage !== undefined) {
            displayValue = `${item.value?.toLocaleString?.() ?? item.value}`;
            extraInfo = ` (${item.payload.percentage}%)`;
          } else if (typeof item.value === 'number') {
            displayValue = item.value.toLocaleString();
          }

          return (
            <div key={`tt-item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" 
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{name}:</span>
              </div>
              <span className="font-bold text-white tracking-tight ml-auto">
                {valuePrefix}{displayValue}{extraInfo}{valueSuffix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: '#334155',
    borderRadius: '12px',
    color: '#ffffff',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
    padding: '8px 12px',
    fontSize: '12px',
  },
  itemStyle: {
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 500,
  },
  labelStyle: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '4px',
  },
};

export default CustomTooltip;
