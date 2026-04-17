import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ArrowLeft, Database, Trash2, MessageCircle } from 'lucide-react';

export const RowViewer = () => {
    const { tableName, id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [relatedMessages, setRelatedMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRowInfo = async () => {
            if (!tableName || !id) return;
            try {
                setLoading(true);
                const { data: rowData, error: dbErr } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (dbErr) throw dbErr;
                setData(rowData);

                // If this is a conversation, fetch the chat timeline
                if (tableName === 'conversations') {
                    const { data: messagesData, error: msgErr } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', id)
                        .order('created_at', { ascending: true });
                    
                    if (!msgErr && messagesData) {
                        setRelatedMessages(messagesData);
                    }
                }
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRowInfo();
    }, [tableName, id]);

    if (loading) return <div className="p-8 text-gray-400">Loading record...</div>;
    if (error) return <div className="p-8 text-red-500 bg-red-500/10 rounded-xl m-8">{error}</div>;

    const handleDelete = async () => {
        if (!window.confirm("Are you incredibly sure you want to delete this row? This is irreversible.")) return;

        try {
            const { error: deletionError } = await supabase.from(tableName as string).delete().eq('id', id);
            if (deletionError) throw deletionError;
            alert("Row deleted securely.");
            navigate(`/dashboard/tables/${tableName}`);
        } catch(err: any) {
            alert(`Deletion failed: ${err.message}`);
        }
    };

    return (
        <div className="max-w-4xl space-y-6 pb-20">
            <button onClick={() => navigate(`/dashboard/tables/${tableName}`)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                <ArrowLeft size={16} /> Back to {tableName}
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Database className="text-violet-500" />
                        Row Inspector
                    </h1>
                    <p className="text-gray-400 mt-1 font-mono text-sm">table: {tableName} | id: {id}</p>
                </div>
                
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={16} /> Delete Record
                </button>
            </div>

            <div className="bg-[#111524] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-[#161a29] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Field Data</span>
                    <span className="text-xs text-gray-500">JSON Visualizer</span>
                </div>
                <div className="p-6 overflow-x-auto custom-scrollbar">
                    {data && Object.keys(data).map((key) => {
                        const val = data[key];
                        const isObject = typeof val === 'object' && val !== null;
                        return (
                            <div key={key} className="flex flex-col md:flex-row border-b border-white/5 last:border-0 py-4">
                                <div className="md:w-1/3 mb-2 md:mb-0">
                                    <span className="font-mono text-sm text-blue-400">{key}</span>
                                </div>
                                <div className="md:w-2/3">
                                    {isObject ? (
                                        <pre className="bg-black/30 p-4 rounded-xl text-xs text-gray-300 font-mono overflow-x-auto border border-white/5">
                                            {JSON.stringify(val, null, 2)}
                                        </pre>
                                    ) : (
                                        <span className="text-gray-200">
                                            {String(val)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Chat History View specifically for Conversations */}
            {tableName === 'conversations' && (
                <div className="bg-[#111524] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mt-8">
                    <div className="bg-[#161a29] px-6 py-4 border-b border-white/5 flex items-center gap-3">
                        <MessageCircle className="text-blue-400" />
                        <span className="font-bold text-lg text-white">Live Chat History</span>
                        <span className="ml-auto text-xs font-bold text-gray-500 uppercase">{relatedMessages.length} Messages</span>
                    </div>
                    <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {relatedMessages.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">No messages found in this conversation.</p>
                        ) : (
                            relatedMessages.map((msg: any) => (
                                <div key={msg.id} className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[11px] text-gray-500 mb-1.5 font-bold tracking-wider uppercase ml-1 mr-1">{msg.role}</span>
                                    <div className={`p-4 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-600/20' : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-sm'}`}>
                                        <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-600 mt-1.5 font-mono">{new Date(msg.created_at).toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
