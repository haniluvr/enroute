import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { RefreshCw } from 'lucide-react';
import { DynamicTable } from '../components/DynamicTable';
import { SlideOver } from '../components/SlideOver';
import { ChatViewer } from '../components/ChatViewer';

export const TableViewer = () => {
  const { tableName } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SlideOver UI state
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const fetchData = async () => {
    if (!tableName) return;
    try {
      setLoading(true);
      setError(null);
      setData([]);

      const { data: rowData, error: dbError } = await supabase
        .from(tableName)
        .select('*')
        .limit(100);

      if (dbError) throw dbError;

      if (rowData && rowData.length > 0) {
        setColumns(Object.keys(rowData[0]));
      } else {
        // Fallback for empty tables if we don't have schema info
        setColumns(['id', 'created_at']);
      }
      
      setData(rowData || []);
    } catch (err: any) {
      console.error(`Error fetching from ${tableName}:`, err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 bg-[#181d2f]/80 backdrop-blur-md border border-white/5 p-4 rounded-xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            {tableName?.replace('_', ' ')}
          </h1>
          <p className="text-gray-400 text-xs font-semibold tracking-wider mt-1 uppercase">Live Database Viewer</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      <div className="flex-1 rounded-2xl border border-white/10 bg-[#161a29] overflow-hidden flex flex-col hide-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
            <span className="ml-3 text-gray-400">Loading {tableName}...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DynamicTable 
                data={data} 
                columns={columns} 
                onRowClick={(row) => {
                    setSelectedRow(row);
                    setIsSlideOpen(true);
                }}
            />
          </div>
        )}
      </div>

      <SlideOver 
          isOpen={isSlideOpen} 
          onClose={() => { setIsSlideOpen(false); setSelectedRow(null); }}
          title={tableName === 'conversations' ? "Transcript Data" : "Inspect Record"}
      >
          {selectedRow && tableName === 'conversations' && (
              <div className="h-[calc(100vh-120px)]">
                  <ChatViewer conversationId={selectedRow.id} />
              </div>
          )}

          {selectedRow && tableName !== 'conversations' && (
              <div className="space-y-4">
                  <p className="text-gray-400 text-sm mb-4">Inspecting row from <span className="text-blue-400 font-mono">{tableName}</span></p>
                  {Object.keys(selectedRow).map(key => (
                      <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <span className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">{key}</span>
                          <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono break-all bg-black/20 p-3 rounded-lg overflow-x-auto">
                              {typeof selectedRow[key] === 'object' ? JSON.stringify(selectedRow[key], null, 2) : String(selectedRow[key])}
                          </pre>
                      </div>
                  ))}
              </div>
          )}
      </SlideOver>
    </div>
  );
};
