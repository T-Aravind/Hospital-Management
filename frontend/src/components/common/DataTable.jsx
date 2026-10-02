import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Search, 
  Database,
  Inbox
} from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  totalRecords = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSort,
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  title = '',
  subtitle = '',
  actions,
  isLoading = false,
}) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords > 0 ? (page - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(page * pageSize, totalRecords);

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = columns.map(c => `"${c.header || c.accessorKey}"`).join(',');
    const rows = data.map(row => {
      return columns.map(c => {
        const val = row[c.accessorKey];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(title || 'records').toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Table Header / Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/40">
        <div>
          {title && (
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {totalRecords.toLocaleString()} Records
              </span>
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search Input */}
          {onSearchChange !== undefined && (
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 shadow-xs"
              />
            </div>
          )}

          {/* Custom Action Slot */}
          {actions}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={!data.length}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-all shadow-xs disabled:opacity-40"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px] relative">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => {
                const isSortable = col.sortable && onSort;
                const isSorted = sortBy === col.accessorKey;
                return (
                  <th
                    key={col.accessorKey || idx}
                    onClick={() => isSortable && onSort(col.accessorKey)}
                    className={`px-4 py-3.5 whitespace-nowrap ${
                      isSortable ? 'cursor-pointer select-none hover:bg-slate-100/80 transition-colors' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-brand-600 font-bold" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-brand-600 font-bold" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="h-10 w-10 stroke-[1.5] mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || row.Admission_ID || row.Patient_ID || row.Doctor_ID || row.Bed_ID || row.Bill_ID || row.Treatment_ID || rIdx}
                  className="hover:bg-teal-50/30 transition-colors group"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-4 py-3 whitespace-nowrap ${col.cellClassName || ''}`}>
                      {col.cell ? col.cell(row) : (row[col.accessorKey] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 text-xs text-slate-600">
        <div className="flex items-center space-x-3">
          <span>
            Showing <strong className="text-slate-900">{startRecord}</strong> to{' '}
            <strong className="text-slate-900">{endRecord}</strong> of{' '}
            <strong className="text-slate-900">{totalRecords.toLocaleString()}</strong> results
          </span>

          {onPageSizeChange && (
            <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
              <span className="text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}
        </div>

        {totalPages > 1 && onPageChange && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
