import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface DynamicTableProps {
  data: any[];
  columns: string[];
  onRowClick?: (row: any) => void;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({ data, columns, onRowClick }) => {
  const navigate = useNavigate();
  const { tableName } = useParams();

  // Utility for truncated or array display
  const renderCell = (value: any) => {
    if (value === null || value === undefined) return <span className="text-gray-600">-</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return '{...}';
    
    // String truncation
    const str = String(value);
    if (str.length > 40) {
      return (
        <span className="text-gray-300" title={str}>
          [SHORT] {str.substring(0, 30)}...
        </span>
      );
    }
    return str;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        No records found in this table.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="sticky top-0 z-10 bg-[#111524] border-b border-white/10 shadow-sm">
        <tr className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
          {columns.map((col) => (
            <th key={col} className="px-6 py-4 whitespace-nowrap bg-[#111524]">
              {col.replace(/_/g, ' ')}
            </th>
          ))}
          <th className="px-4 py-4 w-10 bg-[#111524]"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {data.map((row, index) => (
          <tr 
            key={row.id || index} 
            onClick={() => {
              if (onRowClick) {
                  onRowClick(row);
              } else if (row.id) {
                  navigate(`/dashboard/tables/${tableName}/${row.id}`);
              }
            }}
            className="hover:bg-white/5 transition-colors cursor-pointer group"
          >
            {columns.map((col) => (
              <td key={`${index}-${col}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {renderCell(row[col])}
              </td>
            ))}
            <td className="px-4 py-4 text-right">
                <span className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 inline-block transition-all">›</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
