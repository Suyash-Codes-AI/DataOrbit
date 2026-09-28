import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Papa from 'papaparse';

interface DataTableProps {
  columns: string[];
  rows: Record<string, any>[];
  tableName?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, rows, tableName = 'query_results' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Filter rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row =>
      columns.some(col => String(row[col] ?? '').toLowerCase().includes(term))
    );
  }, [rows, columns, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Numeric comparison
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean') {
        return sortAsc ? numA - numB : numB - numA;
      }

      // String comparison
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, sortCol, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCellValue = (col: string, val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-600 italic">null</span>;
    if (typeof val === 'number') {
      if (/revenue|profit|cost|price|amount/i.test(col)) {
        return <span className="font-mono text-emerald-400">₹{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      }
      if (/discount/i.test(col) && val <= 1) {
        return <span className="font-mono text-amber-400">{(val * 100).toFixed(1)}%</span>;
      }
      return <span className="font-mono text-slate-200">{val.toLocaleString()}</span>;
    }
    return String(val);
  };

  return (
    <div className="bg-[#121620] border border-[#222b3d] rounded-xl overflow-hidden shadow-md mb-6">
      {/* Table Toolbar */}
      <div className="px-5 py-3.5 border-b border-[#202738] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#10141e]">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter results..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0a0d14] border border-[#263147] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            {filteredRows.length.toLocaleString()} rows
          </span>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-[#0a0d14] border border-[#263147] rounded-lg text-xs text-slate-300 px-2 py-1.5 focus:outline-hidden"
          >
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={30}>30 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1b2333] hover:bg-[#253046] border border-[#29354d] text-slate-200 text-xs rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#0b0e14] sticky top-0 z-10 border-b border-[#20283a]">
            <tr>
              <th className="py-2.5 px-3 font-semibold text-slate-400 w-12 text-center font-mono">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="py-2.5 px-3 font-semibold text-slate-300 cursor-pointer hover:text-blue-400 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col}</span>
                    {sortCol === col ? (
                      sortAsc ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2233]">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, rIdx) => {
                const globalIndex = (currentPage - 1) * pageSize + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-3 text-slate-500 font-mono text-center text-[11px]">{globalIndex}</td>
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                        {formatCellValue(col, row[col])}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-slate-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-[#202738] bg-[#0e121a] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-mono">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-slate-200 font-mono">{Math.min(currentPage * pageSize, sortedRows.length)}</span> of{' '}
            <span className="text-slate-200 font-mono">{sortedRows.length.toLocaleString()}</span> entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md bg-[#161d2b] border border-[#252f44] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#202b3e]"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <span className="font-mono text-slate-300 px-2">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md bg-[#161d2b] border border-[#252f44] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#202b3e]"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
